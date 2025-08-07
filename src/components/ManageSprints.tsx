import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { X, Download, Upload, Save, Plus, Trash2 } from 'lucide-react';
import { Sprint } from '@/types/sprint';
import { downloadCSVTemplate, exportSprintsToCSV, parseCSVFile, SprintCSVData } from '@/utils/csvUtils';
import { useToast } from '@/hooks/use-toast';

interface ManageSprintsProps {
  sprints: Sprint[];
  onSave: (sprints: Sprint[]) => void;
  onClose: () => void;
}

export const ManageSprints: React.FC<ManageSprintsProps> = ({ sprints, onSave, onClose }) => {
  const [editableSprints, setEditableSprints] = useState<Sprint[]>([...sprints]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Calculate average velocity from existing sprints
  const calculateAverageVelocity = () => {
    if (editableSprints.length === 0) return 0;
    const totalVelocity = editableSprints.reduce((sum, sprint) => sum + sprint.velocity, 0);
    return Math.round(totalVelocity / editableSprints.length);
  };

  // Calculate team capacity based on average velocity and availability
  const calculateTeamCapacity = (teamAvailability: number) => {
    const avgVelocity = calculateAverageVelocity();
    return Math.round((avgVelocity * teamAvailability) / 100);
  };

  const handleFieldChange = (id: string, field: keyof Sprint, value: string | number) => {
    setEditableSprints(prev => 
      prev.map(sprint => 
        sprint.id === id 
          ? { 
              ...sprint, 
              [field]: value,
              // Recalculate completion ratio, velocity, and team capacity when relevant fields change
              ...(field === 'plannedPoints' || field === 'completedPoints' ? {
                completionRatio: field === 'completedPoints' || field === 'plannedPoints' 
                  ? Math.round(((field === 'completedPoints' ? Number(value) : sprint.completedPoints) / (field === 'plannedPoints' ? Number(value) : sprint.plannedPoints)) * 1000) / 10
                  : sprint.completionRatio,
                velocity: field === 'completedPoints' ? Number(value) : sprint.velocity
              } : {}),
              // Recalculate team capacity when team availability changes
              ...(field === 'teamAvailability' ? {
                teamCapacity: calculateTeamCapacity(Number(value))
              } : {})
            }
          : sprint
      )
    );
  };

  const handleAddSprint = () => {
    const newSprint: Sprint = {
      id: Date.now().toString(),
      name: `Sprint ${editableSprints.length + 1}`,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      plannedPoints: 0,
      completedPoints: 0,
      completionRatio: 0,
      velocity: 0,
      teamCapacity: calculateTeamCapacity(100),
      teamAvailability: 100,
      notes: ''
    };
    setEditableSprints(prev => [...prev, newSprint]);
  };

  const handleDeleteSprint = (id: string) => {
    setEditableSprints(prev => prev.filter(sprint => sprint.id !== id));
  };

  const handleSave = () => {
    onSave(editableSprints);
    toast({
      title: "Sprints Updated",
      description: "All sprint changes have been saved successfully."
    });
    onClose();
  };

  const handleImportCSV = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const csvData = await parseCSVFile(file);
      const importedSprints: Sprint[] = csvData.map((data, index) => ({
        id: Date.now().toString() + index,
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        plannedPoints: data.plannedPoints,
        completedPoints: data.completedPoints,
        completionRatio: data.plannedPoints > 0 ? Math.round((data.completedPoints / data.plannedPoints) * 1000) / 10 : 0,
        velocity: data.completedPoints,
        teamCapacity: calculateTeamCapacity(data.teamAvailability),
        teamAvailability: data.teamAvailability,
        notes: data.notes
      }));

      setEditableSprints(prev => [...prev, ...importedSprints]);
      toast({
        title: "Import Successful",
        description: `Imported ${importedSprints.length} sprints from CSV file.`
      });
    } catch (error) {
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : "Failed to import CSV file",
        variant: "destructive"
      });
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExportCSV = () => {
    exportSprintsToCSV(editableSprints);
    toast({
      title: "Export Successful",
      description: "Sprints data has been exported to CSV file."
    });
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Manage Sprints</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Edit sprint information in bulk, import from CSV, or export current data.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button onClick={handleAddSprint} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Sprint
          </Button>
          <Button onClick={downloadCSVTemplate} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <Button onClick={handleImportCSV} variant="outline" size="sm" disabled={importing}>
            <Upload className="h-4 w-4 mr-2" />
            {importing ? 'Importing...' : 'Import CSV'}
          </Button>
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>

        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Name</TableHead>
                <TableHead className="w-[120px]">Start Date</TableHead>
                <TableHead className="w-[120px]">End Date</TableHead>
                <TableHead className="w-[100px]">Planned Pts</TableHead>
                <TableHead className="w-[100px]">Completed Pts</TableHead>
                <TableHead className="w-[100px]">Team Capacity</TableHead>
                <TableHead className="w-[120px]">Availability %</TableHead>
                <TableHead className="w-[200px]">Notes</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {editableSprints.map((sprint) => (
                <TableRow key={sprint.id}>
                  <TableCell>
                    <Input
                      value={sprint.name}
                      onChange={(e) => handleFieldChange(sprint.id, 'name', e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={sprint.startDate}
                      onChange={(e) => handleFieldChange(sprint.id, 'startDate', e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="date"
                      value={sprint.endDate}
                      onChange={(e) => handleFieldChange(sprint.id, 'endDate', e.target.value)}
                      className="h-8"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={sprint.plannedPoints}
                      onChange={(e) => handleFieldChange(sprint.id, 'plannedPoints', parseFloat(e.target.value) || 0)}
                      className="h-8"
                      min="0"
                      step="0.5"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={sprint.completedPoints}
                      onChange={(e) => handleFieldChange(sprint.id, 'completedPoints', parseFloat(e.target.value) || 0)}
                      className="h-8"
                      min="0"
                      step="0.5"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="h-8 flex items-center px-3 text-sm text-muted-foreground">
                      {sprint.teamCapacity || 0}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={sprint.teamAvailability}
                      onChange={(e) => handleFieldChange(sprint.id, 'teamAvailability', parseFloat(e.target.value) || 100)}
                      className="h-8"
                      min="0"
                      max="100"
                    />
                  </TableCell>
                  <TableCell>
                    <Textarea
                      value={sprint.notes || ''}
                      onChange={(e) => handleFieldChange(sprint.id, 'notes', e.target.value)}
                      className="h-8 min-h-8 resize-none"
                      rows={1}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSprint(sprint.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </DialogContent>
    </Dialog>
  );
};
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X } from 'lucide-react';
import { Sprint } from '@/types/sprint';

interface SprintFormProps {
  sprint?: Sprint;
  onSubmit: (sprint: Omit<Sprint, 'id' | 'completionRatio' | 'velocity'>) => void;
  onCancel: () => void;
}

export const SprintForm: React.FC<SprintFormProps> = ({ sprint, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    startDate: '',
    endDate: '',
    plannedPoints: '',
    completedPoints: '',
    teamCapacity: '',
    notes: ''
  });

  useEffect(() => {
    if (sprint) {
      setFormData({
        name: sprint.name,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        plannedPoints: sprint.plannedPoints.toString(),
        completedPoints: sprint.completedPoints.toString(),
        teamCapacity: sprint.teamCapacity?.toString() || '',
        notes: sprint.notes || ''
      });
    }
  }, [sprint]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    onSubmit({
      name: formData.name,
      startDate: formData.startDate,
      endDate: formData.endDate,
      plannedPoints: parseFloat(formData.plannedPoints) || 0,
      completedPoints: parseFloat(formData.completedPoints) || 0,
      teamCapacity: formData.teamCapacity ? parseFloat(formData.teamCapacity) : undefined,
      notes: formData.notes
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{sprint ? 'Edit Sprint' : 'Add New Sprint'}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Sprint Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Sprint 4"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plannedPoints">Planned Points</Label>
                <Input
                  id="plannedPoints"
                  type="number"
                  value={formData.plannedPoints}
                  onChange={(e) => setFormData(prev => ({ ...prev, plannedPoints: e.target.value }))}
                  placeholder="32"
                  min="0"
                  step="0.5"
                  required
                />
              </div>
              <div>
                <Label htmlFor="completedPoints">Completed Points</Label>
                <Input
                  id="completedPoints"
                  type="number"
                  value={formData.completedPoints}
                  onChange={(e) => setFormData(prev => ({ ...prev, completedPoints: e.target.value }))}
                  placeholder="28"
                  min="0"
                  step="0.5"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="teamCapacity">Team Capacity (optional)</Label>
              <Input
                id="teamCapacity"
                type="number"
                value={formData.teamCapacity}
                onChange={(e) => setFormData(prev => ({ ...prev, teamCapacity: e.target.value }))}
                placeholder="8"
                min="1"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Sprint retrospective notes..."
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                {sprint ? 'Update Sprint' : 'Add Sprint'}
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export interface TeamMember {
  id: string;
  name: string;
  totalSprintDays: number;
  daysAvailable: number;
  availabilityPercentage: number;
}

interface TeamAvailabilityConfigProps {
  currentAvailability: number;
  initialTeamMembers?: TeamMember[];
  onAvailabilityChange: (availability: number, teamMembers: TeamMember[]) => void;
}

export const TeamAvailabilityConfig: React.FC<TeamAvailabilityConfigProps> = ({
  currentAvailability,
  initialTeamMembers,
  onAvailabilityChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const getDefaultTeamMembers = (): TeamMember[] => [
    {
      id: '1',
      name: 'Ana',
      totalSprintDays: 10,
      daysAvailable: 10,
      availabilityPercentage: 100
    },
    {
      id: '2',
      name: 'Bogdan',
      totalSprintDays: 10,
      daysAvailable: 8,
      availabilityPercentage: 80
    }
  ];

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(
    initialTeamMembers && initialTeamMembers.length > 0 ? initialTeamMembers : getDefaultTeamMembers()
  );

  // Update team members when initialTeamMembers prop changes
  React.useEffect(() => {
    if (initialTeamMembers && initialTeamMembers.length > 0) {
      setTeamMembers(initialTeamMembers);
    }
  }, [initialTeamMembers]);

  const calculateAvailabilityPercentage = (totalDays: number, availableDays: number): number => {
    if (totalDays === 0) return 0;
    return Math.round((availableDays / totalDays) * 100);
  };

  const calculateOverallAvailability = (members: TeamMember[]): number => {
    if (members.length === 0) return 100;
    
    const totalAvailability = members.reduce((sum, member) => sum + member.availabilityPercentage, 0);
    return Math.round(totalAvailability / members.length);
  };

  const updateTeamMember = (id: string, field: keyof TeamMember, value: string | number) => {
    setTeamMembers(prev => prev.map(member => {
      if (member.id === id) {
        const updated = { ...member, [field]: value };
        
        // Recalculate availability percentage when total days or available days change
        if (field === 'totalSprintDays' || field === 'daysAvailable') {
          updated.availabilityPercentage = calculateAvailabilityPercentage(
            field === 'totalSprintDays' ? Number(value) : updated.totalSprintDays,
            field === 'daysAvailable' ? Number(value) : updated.daysAvailable
          );
        }
        
        return updated;
      }
      return member;
    }));
  };

  const addTeamMember = () => {
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: `Team Member ${teamMembers.length + 1}`,
      totalSprintDays: 10,
      daysAvailable: 10,
      availabilityPercentage: 100
    };
    setTeamMembers(prev => [...prev, newMember]);
  };

  const removeTeamMember = (id: string) => {
    if (teamMembers.length > 1) {
      setTeamMembers(prev => prev.filter(member => member.id !== id));
    }
  };

  const handleSave = () => {
    const overallAvailability = calculateOverallAvailability(teamMembers);
    onAvailabilityChange(overallAvailability, teamMembers);
    setIsOpen(false);
  };

  const overallAvailability = calculateOverallAvailability(teamMembers);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(true);
          }}
        >
          <Settings className="h-4 w-4" />
          Configure Team Availability
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configure Team Availability</DialogTitle>
          <DialogDescription>
            Set individual team member availability for accurate sprint planning
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Overall Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team Overview</CardTitle>
              <CardDescription>
                Overall team availability: {overallAvailability}%
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Team Members Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Member</TableHead>
                  <TableHead className="text-center">Total Sprint Days</TableHead>
                  <TableHead className="text-center">Days Available</TableHead>
                  <TableHead className="text-center">Availability %</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <Input
                        value={member.name}
                        onChange={(e) => updateTeamMember(member.id, 'name', e.target.value)}
                        className="min-w-[120px]"
                        placeholder="Team member name"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        max="30"
                        value={member.totalSprintDays}
                        onChange={(e) => updateTeamMember(member.id, 'totalSprintDays', parseInt(e.target.value) || 1)}
                        className="w-20 text-center"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max={member.totalSprintDays}
                        value={member.daysAvailable}
                        onChange={(e) => updateTeamMember(member.id, 'daysAvailable', Math.min(member.totalSprintDays, parseInt(e.target.value) || 0))}
                        className="w-20 text-center"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={`font-medium ${
                        member.availabilityPercentage >= 90 ? 'text-success' :
                        member.availabilityPercentage >= 70 ? 'text-warning' :
                        'text-destructive'
                      }`}>
                        {member.availabilityPercentage}%
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTeamMember(member.id)}
                        disabled={teamMembers.length <= 1}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Add Team Member Button */}
          <Button
            variant="outline"
            onClick={addTeamMember}
            className="w-full gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Team Member
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Apply Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Calendar, Target, TrendingUp } from 'lucide-react';
import { Sprint } from '@/types/sprint';

interface SprintListProps {
  sprints: Sprint[];
  onEdit: (sprint: Sprint) => void;
  onDelete: (id: string) => void;
}

export const SprintList: React.FC<SprintListProps> = ({ sprints, onEdit, onDelete }) => {
  const getCompletionBadgeVariant = (ratio: number) => {
    if (ratio >= 90) return 'default';
    if (ratio >= 75) return 'secondary';
    return 'destructive';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (sprints.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No sprints yet</h3>
          <p className="text-muted-foreground text-center">
            Add your first sprint to start tracking velocity and performance metrics.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Sprint History</h2>
        <Badge variant="outline" className="px-3 py-1">
          {sprints.length} Sprint{sprints.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-4">
        {sprints.map((sprint) => (
          <Card key={sprint.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{sprint.name}</h3>
                    <Badge variant={getCompletionBadgeVariant(sprint.completionRatio)}>
                      {sprint.completionRatio}% Complete
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(sprint.startDate)} - {formatDate(sprint.endDate)}
                    </div>
                    {sprint.teamCapacity && (
                      <span>Team: {sprint.teamCapacity} members</span>
                    )}
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Planned:</span>
                      <span>{sprint.plannedPoints} pts</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-4 w-4 text-success" />
                      <span className="font-medium">Completed:</span>
                      <span className="text-success font-medium">{sprint.completedPoints} pts</span>
                    </div>
                  </div>

                  {sprint.notes && (
                    <p className="text-sm text-muted-foreground mt-2 italic">
                      "{sprint.notes}"
                    </p>
                  )}
                </div>

                <div className="flex gap-2 md:flex-col">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(sprint)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(sprint.id)}
                    className="flex items-center gap-1 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Sprint Progress</span>
                  <span>{sprint.completedPoints}/{sprint.plannedPoints} points</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="h-2 rounded-full bg-gradient-to-r from-primary to-success transition-all duration-500"
                    style={{ width: `${Math.min(sprint.completionRatio, 100)}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
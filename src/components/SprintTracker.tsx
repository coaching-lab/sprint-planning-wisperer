import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, TrendingUp, Target, BarChart3 } from 'lucide-react';
import { Sprint, SprintMetrics } from '@/types/sprint';
import { SprintForm } from './SprintForm';
import { SprintList } from './SprintList';
import { VelocityChart } from './VelocityChart';
import { MetricsOverview } from './MetricsOverview';
import { ForecastPanel } from './ForecastPanel';
import { ManageSprints } from './ManageSprints';

export const SprintTracker: React.FC = () => {
  const [sprints, setSprints] = useState<Sprint[]>([
    {
      id: '1',
      name: 'Sprint 1',
      startDate: '2024-01-01',
      endDate: '2024-01-14',
      plannedPoints: 32,
      completedPoints: 28,
      completionRatio: 87.5,
      velocity: 28,
      teamCapacity: 8,
      teamAvailability: 90,
      notes: 'Good sprint, one story moved to next sprint'
    },
    {
      id: '2',
      name: 'Sprint 2',
      startDate: '2024-01-15',
      endDate: '2024-01-28',
      plannedPoints: 30,
      completedPoints: 30,
      completionRatio: 100,
      velocity: 30,
      teamCapacity: 8,
      teamAvailability: 100,
      notes: 'Excellent delivery, all stories completed'
    },
    {
      id: '3',
      name: 'Sprint 3',
      startDate: '2024-01-29',
      endDate: '2024-02-11',
      plannedPoints: 35,
      completedPoints: 26,
      completionRatio: 74.3,
      velocity: 26,
      teamCapacity: 7,
      teamAvailability: 85,
      notes: 'One team member on vacation, technical debt addressed'
    }
  ]);
  
  const [showForm, setShowForm] = useState(false);
  const [editingSprint, setEditingSprint] = useState<Sprint | undefined>();
  const [showManageSprints, setShowManageSprints] = useState(false);

  const calculateMetrics = (): SprintMetrics => {
    if (sprints.length === 0) {
      return {
        averageVelocity: 0,
        averageCompletionRatio: 0,
        totalSprints: 0,
        predictedVelocity: 0
      };
    }

    const totalVelocity = sprints.reduce((sum, sprint) => sum + sprint.velocity, 0);
    const totalCompletionRatio = sprints.reduce((sum, sprint) => sum + sprint.completionRatio, 0);
    
    return {
      averageVelocity: Math.round(totalVelocity / sprints.length),
      averageCompletionRatio: Math.round(totalCompletionRatio / sprints.length),
      totalSprints: sprints.length,
      predictedVelocity: Math.round(totalVelocity / sprints.length)
    };
  };

  const handleAddSprint = (sprintData: Omit<Sprint, 'id' | 'completionRatio' | 'velocity'>) => {
    const completionRatio = sprintData.plannedPoints > 0 
      ? Math.round((sprintData.completedPoints / sprintData.plannedPoints) * 100) 
      : 0;
    
    const newSprint: Sprint = {
      ...sprintData,
      id: Date.now().toString(),
      completionRatio,
      velocity: sprintData.completedPoints
    };

    setSprints(prev => [...prev, newSprint]);
    setShowForm(false);
  };

  const handleEditSprint = (sprintData: Omit<Sprint, 'id' | 'completionRatio' | 'velocity'>) => {
    if (!editingSprint) return;

    const completionRatio = sprintData.plannedPoints > 0 
      ? Math.round((sprintData.completedPoints / sprintData.plannedPoints) * 100) 
      : 0;

    const updatedSprint: Sprint = {
      ...sprintData,
      id: editingSprint.id,
      completionRatio,
      velocity: sprintData.completedPoints
    };

    setSprints(prev => prev.map(sprint => 
      sprint.id === editingSprint.id ? updatedSprint : sprint
    ));
    setEditingSprint(undefined);
    setShowForm(false);
  };

  const handleDeleteSprint = (id: string) => {
    setSprints(prev => prev.filter(sprint => sprint.id !== id));
  };

  const handleManageSprints = () => {
    setShowManageSprints(true);
  };

  const handleSaveManageSprints = (updatedSprints: Sprint[]) => {
    setSprints(updatedSprints);
    setShowManageSprints(false);
  };

  const metrics = calculateMetrics();

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Sprint Velocity Tracker</h1>
            <p className="text-muted-foreground">
              Track sprint performance, analyze velocity trends, and forecast future capacity
            </p>
          </div>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90 transition-all duration-300 shadow-lg"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Sprint
          </Button>
        </div>

        {/* Metrics Overview */}
        <MetricsOverview metrics={metrics} />

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-fit">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="sprints" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Sprints
            </TabsTrigger>
            <TabsTrigger value="trends" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="forecast" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Forecast
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <VelocityChart sprints={sprints} />
              <Card>
                <CardHeader>
                  <CardTitle>Recent Performance</CardTitle>
                  <CardDescription>
                    Last 5 sprints completion rates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sprints.slice(-5).reverse().map((sprint) => (
                      <div key={sprint.id} className="flex items-center justify-between">
                        <span className="font-medium">{sprint.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-muted rounded-full h-2">
                            <div 
                              className="h-2 rounded-full bg-gradient-to-r from-accent to-success transition-all duration-500"
                              style={{ width: `${sprint.completionRatio}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium min-w-12">{sprint.completionRatio}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="sprints">
            <SprintList 
              sprints={sprints}
              onEdit={(sprint) => {
                setEditingSprint(sprint);
                setShowForm(true);
              }}
              onDelete={handleDeleteSprint}
              onManageSprints={handleManageSprints}
            />
          </TabsContent>

          <TabsContent value="trends">
            <VelocityChart sprints={sprints} detailed />
          </TabsContent>

          <TabsContent value="forecast">
            <ForecastPanel sprints={sprints} metrics={metrics} />
          </TabsContent>
        </Tabs>

        {/* Sprint Form Modal */}
        {showForm && (
          <SprintForm
            sprint={editingSprint}
            sprints={sprints}
            onSubmit={editingSprint ? handleEditSprint : handleAddSprint}
            onCancel={() => {
              setShowForm(false);
              setEditingSprint(undefined);
            }}
          />
        )}

        {/* Manage Sprints Modal */}
        {showManageSprints && (
          <ManageSprints
            sprints={sprints}
            onSave={handleSaveManageSprints}
            onClose={() => setShowManageSprints(false)}
          />
        )}
      </div>
    </div>
  );
};
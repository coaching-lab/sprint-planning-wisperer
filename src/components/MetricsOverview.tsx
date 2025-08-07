import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Target, BarChart3, Zap, Users } from 'lucide-react';
import { SprintMetrics } from '@/types/sprint';

interface MetricsOverviewProps {
  metrics: SprintMetrics;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ metrics }) => {
  const metricCards = [
    {
      title: 'Average Velocity',
      value: metrics.averageVelocity,
      suffix: 'pts',
      icon: TrendingUp,
      description: 'Story points per sprint',
      color: 'text-primary'
    },
    {
      title: 'Completion Rate',
      value: metrics.averageCompletionRatio,
      suffix: '%',
      icon: Target,
      description: 'Planned vs completed',
      color: 'text-success'
    },
    {
      title: 'Total Sprints',
      value: metrics.totalSprints,
      suffix: '',
      icon: BarChart3,
      description: 'Sprints tracked',
      color: 'text-accent'
    },
    {
      title: 'Team Availability',
      value: metrics.teamAvailabilityConsistency,
      suffix: '%',
      icon: Users,
      description: 'Availability stability',
      color: 'text-info'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metricCards.map((metric, index) => (
        <Card key={index} className="hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-1">
              <div className="text-2xl font-bold">
                {metric.value}
              </div>
              {metric.suffix && (
                <span className="text-sm text-muted-foreground">{metric.suffix}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
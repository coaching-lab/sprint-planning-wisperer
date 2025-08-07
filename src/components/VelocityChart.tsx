import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, ComposedChart } from 'recharts';
import { Sprint } from '@/types/sprint';

interface VelocityChartProps {
  sprints: Sprint[];
  detailed?: boolean;
  recentSprintsCount?: number;
}

export const VelocityChart: React.FC<VelocityChartProps> = ({ sprints, detailed = false, recentSprintsCount }) => {
  // Filter to recent sprints if specified - sort by start date descending (most recent first) then take first X
  const filteredSprints = recentSprintsCount
    ? [...sprints]
        .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
        .slice(0, Math.min(recentSprintsCount, sprints.length))
    : sprints;
  
  // Sort by start date ascending for trend analysis display (oldest first for chronological trends)
  const sortedSprints = [...filteredSprints].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  );

  const chartData = sortedSprints.map((sprint, index) => ({
    name: sprint.name,
    planned: sprint.plannedPoints,
    completed: sprint.completedPoints,
    velocity: sprint.velocity,
    completionRatio: sprint.completionRatio,
    teamAvailability: sprint.teamAvailability,
    sprintNumber: index + 1
  }));

  if (detailed) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Velocity Trend Analysis</CardTitle>
            <CardDescription>
              Track your team's velocity over time to identify patterns and improvements
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    yAxisId="left"
                    className="text-muted-foreground" 
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    className="text-muted-foreground"
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="planned" 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    name="Planned Points"
                  />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="completed" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={3}
                    name="Completed Points"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="teamAvailability" 
                    stroke="hsl(var(--accent))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
                    name="Team Availability (%)"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completion Ratio by Sprint</CardTitle>
            <CardDescription>
              Percentage of planned work completed in each sprint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="name" 
                    className="text-muted-foreground"
                  />
                  <YAxis 
                    className="text-muted-foreground"
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value}%`, 'Completion Rate']}
                  />
                  <Bar 
                    dataKey="completionRatio" 
                    fill="hsl(var(--accent))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Velocity Overview</CardTitle>
        <CardDescription>
          Planned vs completed story points with velocity trend
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-muted-foreground"
                fontSize={12}
              />
              <YAxis className="text-muted-foreground" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Bar 
                dataKey="planned" 
                fill="hsl(var(--muted-foreground))" 
                name="Planned"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="completed" 
                fill="hsl(var(--primary))" 
                name="Completed"
                radius={[2, 2, 0, 0]}
              />
              <Line 
                type="monotone" 
                dataKey="velocity" 
                stroke="hsl(var(--accent))" 
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--accent))', strokeWidth: 2, r: 4 }}
                name="Velocity"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
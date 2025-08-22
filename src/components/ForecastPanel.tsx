import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, AlertTriangle, CheckCircle, Target, Users } from 'lucide-react';
import { Sprint, SprintMetrics, ForecastData } from '@/types/sprint';
import { TeamAvailabilityConfig, type TeamMember } from '@/components/TeamAvailabilityConfig';

interface ForecastPanelProps {
  sprints: Sprint[];
  metrics: SprintMetrics;
  recentSprintsCount: number;
}

export const ForecastPanel: React.FC<ForecastPanelProps> = ({ sprints, metrics, recentSprintsCount }) => {
  // Calculate average team availability from recent sprints
  const averageTeamAvailability = useMemo(() => {
    if (sprints.length === 0) return 100;
    
    const sortedSprints = [...sprints].sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    const recentSprints = sortedSprints.slice(0, Math.min(recentSprintsCount, sprints.length));
    
    const totalAvailability = recentSprints.reduce((sum, sprint) => sum + sprint.teamAvailability, 0);
    return Math.round(totalAvailability / recentSprints.length);
  }, [sprints, recentSprintsCount]);

  const [nextSprintAvailability, setNextSprintAvailability] = useState<number>(averageTeamAvailability);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [trendAnalysisSprintCount, setTrendAnalysisSprintCount] = useState<number>(Math.min(5, sprints.length));

  // Update when average changes or sprint count changes
  React.useEffect(() => {
    setNextSprintAvailability(averageTeamAvailability);
    setTrendAnalysisSprintCount(Math.max(2, Math.min(5, sprints.length)));
  }, [averageTeamAvailability, sprints.length]);

  const handleAvailabilityConfigChange = (availability: number, members: TeamMember[]) => {
    setNextSprintAvailability(availability);
    setTeamMembers(members);
  };

  const calculateForecast = (teamAvailability: number): ForecastData => {
    if (sprints.length < 2) {
      return {
        recommendedPlanning: metrics.averageVelocity || 0,
        confidenceLevel: 0,
        basedOnSprints: sprints.length
      };
    }

    // Sort sprints by start date descending (most recent first) and take the first recentSprintsCount
    const sortedSprints = [...sprints].sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    const recentSprints = sortedSprints.slice(0, Math.min(recentSprintsCount, sprints.length)); // First N recent sprints
    let weightedSum = 0;
    let totalWeight = 0;

    recentSprints.forEach((sprint, index) => {
      const weight = recentSprints.length - index; // More recent sprints get higher weight
      weightedSum += sprint.velocity * weight;
      totalWeight += weight;
    });

    const weightedAverage = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Adjust forecast based on team availability
    const availabilityFactor = teamAvailability / 100;
    const adjustedForecast = weightedAverage * availabilityFactor;

    // Calculate confidence based on consistency and team availability factor
    const velocities = recentSprints.map(s => s.velocity);
    const mean = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
    const variance = velocities.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / velocities.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 1;
    
    // Lower coefficient of variation means higher confidence
    let confidenceLevel = Math.max(0, Math.min(100, (1 - coefficientOfVariation) * 100));
    
    // Adjust confidence based on team availability consistency
    const availabilities = recentSprints.map(s => s.teamAvailability);
    const avgAvailability = availabilities.reduce((sum, a) => sum + a, 0) / availabilities.length;
    const availabilityVariance = availabilities.reduce((sum, a) => sum + Math.pow(a - avgAvailability, 2), 0) / availabilities.length;
    const availabilityStdDev = Math.sqrt(availabilityVariance);
    const availabilityCoV = avgAvailability > 0 ? availabilityStdDev / avgAvailability : 0;
    
    // Reduce confidence if team availability varies significantly from historical average
    const availabilityDifference = Math.abs(teamAvailability - avgAvailability) / 100;
    confidenceLevel = confidenceLevel * (1 - availabilityDifference * 0.5) * (1 - availabilityCoV * 0.3);

    return {
      recommendedPlanning: Math.round(adjustedForecast),
      confidenceLevel: Math.round(Math.max(0, Math.min(100, confidenceLevel))),
      basedOnSprints: recentSprints.length
    };
  };

  const forecastData = calculateForecast(nextSprintAvailability);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-success';
    if (confidence >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 80) return CheckCircle;
    if (confidence >= 60) return AlertTriangle;
    return AlertTriangle;
  };

  const ConfidenceIcon = getConfidenceIcon(forecastData.confidenceLevel);

  const getRecommendations = () => {
    const recommendations = [];
    
    if (sprints.length === 0) return recommendations;

    // Sort sprints by start date descending (most recent first)
    const sortedSprints = [...sprints].sort((a, b) => 
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
    
    // Get sprints for trend analysis
    const trendSprints = sortedSprints.slice(0, Math.min(trendAnalysisSprintCount, sprints.length));
    
    if (trendSprints.length < 2) {
      recommendations.push({
        type: 'info',
        title: 'Insufficient Data for Trend Analysis',
        message: `Need at least 2 sprints for trend analysis. Currently analyzing ${trendSprints.length} sprint${trendSprints.length !== 1 ? 's' : ''}.`
      });
      return recommendations;
    }

    // 1. VELOCITY TREND ANALYSIS
    const velocities = trendSprints.map(s => s.velocity);
    const velocityTrend = calculateTrend(velocities);
    
    if (velocityTrend.slope > 1) {
      recommendations.push({
        type: 'success',
        title: 'Velocity Improving',
        message: `Team velocity is trending upward (+${velocityTrend.slope.toFixed(1)} pts/sprint). Keep up the momentum! Consider what's working well and apply it consistently.`
      });
    } else if (velocityTrend.slope < -1) {
      recommendations.push({
        type: 'warning',
        title: 'Velocity Declining',
        message: `Team velocity is trending downward (${velocityTrend.slope.toFixed(1)} pts/sprint). Investigate potential blockers, technical debt, or team capacity issues.`
      });
    }

    // 2. COMPLETION RATIO TREND ANALYSIS
    const completionRatios = trendSprints.map(s => s.completionRatio);
    const completionTrend = calculateTrend(completionRatios);
    
    if (completionTrend.slope > 5) {
      recommendations.push({
        type: 'success',
        title: 'Completion Rate Improving',
        message: `Sprint completion rate is improving (+${completionTrend.slope.toFixed(1)}%/sprint). Your estimation and planning are getting more accurate.`
      });
    } else if (completionTrend.slope < -5) {
      recommendations.push({
        type: 'warning',
        title: 'Completion Rate Declining',
        message: `Sprint completion rate is declining (${completionTrend.slope.toFixed(1)}%/sprint). Consider reducing planned points or improving story estimation.`
      });
    }

    // 3. TEAM AVAILABILITY TREND ANALYSIS
    const availabilities = trendSprints.map(s => s.teamAvailability);
    const availabilityTrend = calculateTrend(availabilities);
    
    if (availabilityTrend.slope < -5) {
      recommendations.push({
        type: 'warning',
        title: 'Team Availability Declining',
        message: `Team availability is trending downward (${availabilityTrend.slope.toFixed(1)}%/sprint). Monitor team workload and consider capacity planning adjustments.`
      });
    }

    // 4. CONSISTENCY ANALYSIS
    const velocityConsistency = calculateConsistency(velocities);
    const completionConsistency = calculateConsistency(completionRatios);
    
    if (velocityConsistency < 0.7) {
      recommendations.push({
        type: 'warning',
        title: 'Velocity Inconsistency',
        message: `High velocity variation detected (consistency: ${(velocityConsistency * 100).toFixed(0)}%). Focus on breaking down stories more consistently and identifying factors causing variation.`
      });
    }

    if (completionConsistency < 0.7) {
      recommendations.push({
        type: 'info',
        title: 'Completion Rate Variability',
        message: `Completion rates vary significantly (consistency: ${(completionConsistency * 100).toFixed(0)}%). Review estimation practices and sprint planning process.`
      });
    }

    // 5. OVERCOMMITMENT ANALYSIS
    const overcommittedSprints = trendSprints.filter(s => s.completionRatio < 80);
    if (overcommittedSprints.length > trendSprints.length * 0.5) {
      recommendations.push({
        type: 'warning',
        title: 'Frequent Overcommitment',
        message: `${overcommittedSprints.length} out of ${trendSprints.length} recent sprints had <80% completion. Consider more conservative planning or improving story breakdown.`
      });
    }

    // 6. UNDERUTILIZATION ANALYSIS
    const underutilizedSprints = trendSprints.filter(s => s.completionRatio >= 100);
    if (underutilizedSprints.length > trendSprints.length * 0.6) {
      recommendations.push({
        type: 'info',
        title: 'Potential Underutilization',
        message: `${underutilizedSprints.length} out of ${trendSprints.length} recent sprints were completed at 100%+. Consider planning more ambitious goals or tackling technical debt.`
      });
    }

    // 7. TEAM AVAILABILITY RECOMMENDATIONS
    if (nextSprintAvailability < averageTeamAvailability - 10) {
      recommendations.push({
        type: 'warning',
        title: 'Reduced Team Availability',
        message: `Team availability (${nextSprintAvailability}%) is significantly lower than average (${averageTeamAvailability}%). Consider reducing planned work by ${Math.round((averageTeamAvailability - nextSprintAvailability) * 0.8)}%.`
      });
    } else if (nextSprintAvailability > averageTeamAvailability + 10) {
      recommendations.push({
        type: 'success',
        title: 'Increased Team Availability',
        message: `Team availability (${nextSprintAvailability}%) is higher than average (${averageTeamAvailability}%). Good opportunity for stretch goals or technical improvements.`
      });
    }

    // 8. FORECAST CONFIDENCE RECOMMENDATIONS
    if (forecastData.confidenceLevel < 60) {
      recommendations.push({
        type: 'warning',
        title: 'Low Forecast Confidence',
        message: `Forecast confidence is ${forecastData.confidenceLevel}%. Focus on consistent story sizing, reducing external dependencies, and stabilizing team composition.`
      });
    }

    // 9. DATA SUFFICIENCY
    if (trendSprints.length < 5) {
      recommendations.push({
        type: 'info',
        title: 'Limited Historical Data',
        message: `Analysis based on ${trendSprints.length} sprints. Recommendations will become more accurate with more historical data (target: 5+ sprints).`
      });
    }

    return recommendations;
  };

  // Helper function to calculate linear trend (slope)
  const calculateTrend = (values: number[]) => {
    if (values.length < 2) return { slope: 0 };
    
    const n = values.length;
    const xSum = (n * (n - 1)) / 2; // Sum of indices 0, 1, 2, ...
    const ySum = values.reduce((sum, val) => sum + val, 0);
    const xySum = values.reduce((sum, val, i) => sum + (i * val), 0);
    const xxSum = values.reduce((sum, _, i) => sum + (i * i), 0);
    
    const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
    return { slope: isNaN(slope) ? 0 : slope };
  };

  // Helper function to calculate consistency (inverse of coefficient of variation)
  const calculateConsistency = (values: number[]) => {
    if (values.length < 2) return 1;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    if (mean === 0) return 1;
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = stdDev / mean;
    
    return Math.max(0, 1 - coefficientOfVariation);
  };

  const recommendations = getRecommendations();

  return (
    <div className="space-y-6">
      {/* Team Availability Input */}
      <Card className="bg-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Next Sprint Planning
          </CardTitle>
          <CardDescription>
            Configure team availability for the next sprint to get accurate forecasts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="team-availability">Team Availability (%)</Label>
                <Input
                  id="team-availability"
                  type="number"
                  min="0"
                  max="100"
                  value={nextSprintAvailability}
                  onChange={(e) => setNextSprintAvailability(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                  className="text-center text-lg font-medium"
                />
                <p className="text-xs text-muted-foreground">
                  Average from last {recentSprintsCount} sprint{recentSprintsCount !== 1 ? 's' : ''}: {averageTeamAvailability}%
                </p>
              </div>
              <TeamAvailabilityConfig
                currentAvailability={nextSprintAvailability}
                initialTeamMembers={teamMembers}
                onAvailabilityChange={handleAvailabilityConfigChange}
              />
            </div>
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary mb-1">
                  {forecastData.recommendedPlanning} pts
                </div>
                <div className="text-sm text-muted-foreground">
                  Adjusted Forecast
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forecast Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Next Sprint Forecast
            </CardTitle>
            <CardDescription>
              Based on {forecastData.basedOnSprints} recent sprint{forecastData.basedOnSprints !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Recommended Planning</span>
                  <Badge variant="outline" className="text-lg px-3 py-1">
                    {forecastData.recommendedPlanning} pts
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Plan for approximately {forecastData.recommendedPlanning} story points in your next sprint
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Confidence Level</span>
                  <div className="flex items-center gap-2">
                    <ConfidenceIcon className={`h-4 w-4 ${getConfidenceColor(forecastData.confidenceLevel)}`} />
                    <span className={`font-medium ${getConfidenceColor(forecastData.confidenceLevel)}`}>
                      {forecastData.confidenceLevel}%
                    </span>
                  </div>
                </div>
                <Progress 
                  value={forecastData.confidenceLevel} 
                  className="h-2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Based on velocity consistency
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent" />
              Planning Scenarios
            </CardTitle>
            <CardDescription>
              Different planning options based on risk tolerance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-success/5 rounded-lg border border-success/20">
                <div>
                  <span className="font-medium text-success">Conservative</span>
                  <p className="text-xs text-muted-foreground">90% confidence</p>
                </div>
                <Badge variant="outline" className="text-success border-success">
                  {Math.round(forecastData.recommendedPlanning * 0.8)} pts
                </Badge>
              </div>

              <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div>
                  <span className="font-medium text-primary">Recommended</span>
                  <p className="text-xs text-muted-foreground">Based on {nextSprintAvailability}% availability</p>
                </div>
                <Badge variant="outline" className="text-primary border-primary">
                  {forecastData.recommendedPlanning} pts
                </Badge>
              </div>

              <div className="flex justify-between items-center p-3 bg-warning/5 rounded-lg border border-warning/20">
                <div>
                  <span className="font-medium text-warning">Aggressive</span>
                  <p className="text-xs text-muted-foreground">Stretch goal</p>
                </div>
                <Badge variant="outline" className="text-warning border-warning">
                  {Math.round(forecastData.recommendedPlanning * 1.2)} pts
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recommendations</CardTitle>
                <CardDescription>
                  Insights and suggestions based on your sprint data
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="trend-sprints" className="text-sm">Analyze last</Label>
                <Input
                  id="trend-sprints"
                  type="number"
                  min="2"
                  max={Math.min(10, sprints.length)}
                  value={trendAnalysisSprintCount}
                  onChange={(e) => setTrendAnalysisSprintCount(Math.max(2, Math.min(10, parseInt(e.target.value) || 2)))}
                  className="w-16 text-center"
                />
                <span className="text-sm text-muted-foreground">sprints</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  rec.type === 'success' ? 'bg-success/5 border-success/20' :
                  rec.type === 'warning' ? 'bg-warning/5 border-warning/20' :
                  'bg-primary/5 border-primary/20'
                }`}>
                  <h4 className={`font-medium mb-1 ${
                    rec.type === 'success' ? 'text-success' :
                    rec.type === 'warning' ? 'text-warning' :
                    'text-primary'
                  }`}>
                    {rec.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">{rec.message}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
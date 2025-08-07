import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, AlertTriangle, CheckCircle, Target } from 'lucide-react';
import { Sprint, SprintMetrics, ForecastData } from '@/types/sprint';

interface ForecastPanelProps {
  sprints: Sprint[];
  metrics: SprintMetrics;
  recentSprintsCount: number;
}

export const ForecastPanel: React.FC<ForecastPanelProps> = ({ sprints, metrics, recentSprintsCount }) => {
  const calculateForecast = (): ForecastData => {
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
      const weight = index + 1; // More recent sprints get higher weight
      weightedSum += sprint.velocity * weight;
      totalWeight += weight;
    });

    const weightedAverage = totalWeight > 0 ? weightedSum / totalWeight : 0;

    // Calculate confidence based on consistency
    const velocities = recentSprints.map(s => s.velocity);
    const mean = velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
    const variance = velocities.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / velocities.length;
    const stdDev = Math.sqrt(variance);
    const coefficientOfVariation = mean > 0 ? stdDev / mean : 1;
    
    // Lower coefficient of variation means higher confidence
    const confidenceLevel = Math.max(0, Math.min(100, (1 - coefficientOfVariation) * 100));

    return {
      recommendedPlanning: Math.round(weightedAverage),
      confidenceLevel: Math.round(confidenceLevel),
      basedOnSprints: recentSprints.length
    };
  };

  const forecastData = calculateForecast();

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
    
    if (forecastData.confidenceLevel < 60) {
      recommendations.push({
        type: 'warning',
        title: 'Low Confidence',
        message: 'Your velocity varies significantly. Consider analyzing what causes these variations.'
      });
    }

    if (metrics.averageCompletionRatio < 80) {
      recommendations.push({
        type: 'info',
        title: 'Completion Rate',
        message: 'Consider planning slightly fewer points to improve completion rates.'
      });
    }

    if (sprints.length < 3) {
      recommendations.push({
        type: 'info',
        title: 'More Data Needed',
        message: 'Add more sprint data for more accurate forecasting.'
      });
    }

    const trend = sprints.length >= 3 ? 
      sprints.slice(-3).reduce((sum, s) => sum + s.velocity, 0) / 3 - 
      sprints.slice(0, -3).reduce((sum, s) => sum + s.velocity, 0) / Math.max(1, sprints.length - 3) : 0;

    if (trend > 2) {
      recommendations.push({
        type: 'success',
        title: 'Improving Velocity',
        message: 'Your team velocity is trending upward. Great progress!'
      });
    } else if (trend < -2) {
      recommendations.push({
        type: 'warning',
        title: 'Declining Velocity',
        message: 'Velocity is trending downward. Consider investigating potential blockers.'
      });
    }

    return recommendations;
  };

  const recommendations = getRecommendations();

  return (
    <div className="space-y-6">
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
                  <p className="text-xs text-muted-foreground">Best estimate</p>
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
            <CardTitle>Recommendations</CardTitle>
            <CardDescription>
              Insights and suggestions based on your sprint data
            </CardDescription>
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
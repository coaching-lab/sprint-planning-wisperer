export interface Sprint {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  plannedPoints: number;
  completedPoints: number;
  completionRatio: number;
  velocity: number;
  teamCapacity?: number;
  teamAvailability?: number;
  notes?: string;
}

export interface SprintMetrics {
  averageVelocity: number;
  averageCompletionRatio: number;
  totalSprints: number;
  predictedVelocity: number;
  forecastAccuracy?: number;
}

export interface ForecastData {
  recommendedPlanning: number;
  confidenceLevel: number;
  basedOnSprints: number;
}
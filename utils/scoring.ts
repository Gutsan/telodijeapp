export function calculatePoints(
  homePrediction: number,
  awayPrediction: number,
  homeActual: number,
  awayActual: number
): number {
  // Exact match: 3 points
  if (homePrediction === homeActual && awayPrediction === awayActual) {
    return 3;
  }

  // Correct trend: 1 point
  const predictedWinner = homePrediction > awayPrediction ? 'home' : 
                          homePrediction < awayPrediction ? 'away' : 'draw';
  const actualWinner = homeActual > awayActual ? 'home' : 
                       homeActual < awayActual ? 'away' : 'draw';

  if (predictedWinner === actualWinner) {
    return 1;
  }

  // No match: 0 points
  return 0;
}

export function formatPoints(points: number): string {
  return `${points} pts`;
}

export function getPositionSuffix(position: number): string {
  if (position === 1) return '°';
  if (position === 2) return '°';
  if (position === 3) return '°';
  return '°';
}

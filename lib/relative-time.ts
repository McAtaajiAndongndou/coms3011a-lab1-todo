/**
 * Turns the days_until value computed in SQL into the label shown in the time
 * gutter. Kept separate from the query so the wording is in one place.
 */
export function relativeDue(days: number, isOverdue: boolean): string {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days === -1) return isOverdue ? '1 day late' : 'yesterday';
  if (days < 0) return isOverdue ? `${-days} days late` : `${-days} days ago`;
  if (days < 7) return `in ${days} days`;
  if (days < 14) return 'next week';
  if (days < 31) return `in ${Math.round(days / 7)} weeks`;
  return `in ${Math.round(days / 30)} months`;
}

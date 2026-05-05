export function calculateAverageRating(ratings: number[]): number | null {
  if (ratings.length === 0) return null
  const sum = ratings.reduce((acc, r) => acc + r, 0)
  return Math.round((sum / ratings.length) * 10) / 10
}

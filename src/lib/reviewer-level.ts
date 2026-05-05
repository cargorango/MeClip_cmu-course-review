export type ReviewerLevel = "น้องใหม่" | "มีประสบการณ์" | "ตำนานมหาลัย"

export function calculateReviewerLevel(uniqueCoursesReviewed: number): ReviewerLevel {
  if (uniqueCoursesReviewed >= 11) return "ตำนานมหาลัย"
  if (uniqueCoursesReviewed >= 6)  return "มีประสบการณ์"
  return "น้องใหม่"
}

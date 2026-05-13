export type ReviewerLevel = "เริ่มรีวิว" | "มีประสบการณ์" | "ตำนานมหาลัย"

export function calculateReviewerLevel(uniqueCoursesReviewed: number): ReviewerLevel {
  if (uniqueCoursesReviewed >= 11) return "ตำนานมหาลัย"
  if (uniqueCoursesReviewed >= 6)  return "มีประสบการณ์"
  return "เริ่มรีวิว"
}

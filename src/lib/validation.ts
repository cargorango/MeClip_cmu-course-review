export function validateDisplayName(name: string): boolean {
  return name.length >= 1 && name.length <= 50
}

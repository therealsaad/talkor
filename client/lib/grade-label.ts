export function gradeLabel(grade: number): string {
  return grade === 0 ? 'KG' : `Class ${grade}`
}

export function gradeLongLabel(grade: number): string {
  return grade === 0 ? 'Kindergarten (KG)' : `Class ${grade}`
}

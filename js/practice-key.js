export function practiceKey(lesson, index) {
  return `${lesson.id}:${lesson.practiceVersion ? `${lesson.practiceVersion}:` : ""}${index}`;
}

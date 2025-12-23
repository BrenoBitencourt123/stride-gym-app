// Utilitários de semana e treino do dia

export interface WorkoutScheduleEntry {
  workoutId: string | null; // null = dia de descanso
}

// Cronograma semanal: segunda = 0, domingo = 6
// Segunda: Upper A, Terça: Lower A, Quarta: Descanso, Quinta: Upper B, Sexta: Lower B, Sábado/Domingo: Descanso
const WEEKLY_SCHEDULE: WorkoutScheduleEntry[] = [
  { workoutId: 'upper-a' },   // Segunda (0)
  { workoutId: 'lower-a' },   // Terça (1)
  { workoutId: null },        // Quarta (2) - Descanso
  { workoutId: 'upper-b' },   // Quinta (3)
  { workoutId: 'lower-b' },   // Sexta (4)
  { workoutId: null },        // Sábado (5) - Descanso
  { workoutId: null },        // Domingo (6) - Descanso
];

/**
 * Retorna a segunda-feira da semana da data fornecida
 * Formato: YYYY-MM-DD
 */
export function getWeekStart(date: Date = new Date()): string {
  const d = new Date(date);
  const day = d.getDay(); // 0 = domingo, 1 = segunda, etc.
  
  // Converter para sistema onde segunda = 0
  // Se for domingo (0), voltar 6 dias
  // Se for segunda (1), voltar 0 dias
  // Se for terça (2), voltar 1 dia, etc.
  const daysFromMonday = day === 0 ? 6 : day - 1;
  
  d.setDate(d.getDate() - daysFromMonday);
  d.setHours(0, 0, 0, 0);
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${dayOfMonth}`;
}

/**
 * Retorna o índice do dia da semana onde segunda = 0
 */
export function getDayIndex(date: Date = new Date()): number {
  const day = date.getDay();
  return day === 0 ? 6 : day - 1;
}

/**
 * Retorna o ID do treino do dia ou null se for descanso
 */
export function getWorkoutOfDay(date: Date = new Date()): string | null {
  const dayIndex = getDayIndex(date);
  return WEEKLY_SCHEDULE[dayIndex].workoutId;
}

/**
 * Retorna o nome do dia da semana em português
 */
export function getDayName(date: Date = new Date()): string {
  const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return days[date.getDay()];
}

/**
 * Verifica se o dia é de descanso
 */
export function isRestDay(date: Date = new Date()): boolean {
  return getWorkoutOfDay(date) === null;
}

/**
 * Retorna o cronograma completo da semana com IDs
 */
export function getWeeklySchedule(): { dayName: string; workoutId: string | null }[] {
  const days = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
  return WEEKLY_SCHEDULE.map((entry, index) => ({
    dayName: days[index],
    workoutId: entry.workoutId,
  }));
}

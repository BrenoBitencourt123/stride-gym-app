// Utilitários de semana e treino do dia

import { getUserWorkoutPlan } from './storage';

export interface WorkoutScheduleEntry {
  workoutId: string | null; // null = dia de descanso
}

// Dias da semana em português (índice 0 = Segunda)
const DAY_NAMES = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

// Cronograma padrão (fallback): segunda = 0, domingo = 6
const DEFAULT_SCHEDULE: WorkoutScheduleEntry[] = [
  { workoutId: 'upper-a' },   // Segunda (0)
  { workoutId: 'lower-a' },   // Terça (1)
  { workoutId: null },        // Quarta (2) - Descanso
  { workoutId: 'upper-b' },   // Quinta (3)
  { workoutId: 'lower-b' },   // Sexta (4)
  { workoutId: null },        // Sábado (5) - Descanso
  { workoutId: null },        // Domingo (6) - Descanso
];

/**
 * Obtém o cronograma do usuário com base nos scheduledDays de cada workout
 */
function getUserSchedule(): WorkoutScheduleEntry[] {
  const plan = getUserWorkoutPlan();
  
  // Inicializa todos os dias como descanso
  const schedule: WorkoutScheduleEntry[] = Array(7).fill(null).map(() => ({ workoutId: null }));
  
  // Mapeia os workouts para seus dias agendados
  for (const workout of plan.workouts) {
    if (workout.scheduledDays && workout.scheduledDays.length > 0) {
      for (const day of workout.scheduledDays) {
        if (day >= 0 && day <= 6) {
          schedule[day] = { workoutId: workout.id };
        }
      }
    }
  }
  
  // Se nenhum workout tem dias agendados, usa o fallback padrão
  const hasAnySchedule = schedule.some(s => s.workoutId !== null);
  if (!hasAnySchedule) {
    return DEFAULT_SCHEDULE;
  }
  
  return schedule;
}

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
  const schedule = getUserSchedule();
  return schedule[dayIndex].workoutId;
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
  const schedule = getUserSchedule();
  return schedule.map((entry, index) => ({
    dayName: DAY_NAMES[index],
    workoutId: entry.workoutId,
  }));
}

/**
 * Retorna os nomes dos dias da semana
 */
export function getScheduleDayNames(): string[] {
  return DAY_NAMES;
}

export enum Goal {
  HYPERTROPHY = 'Hipertrofia (Ganho de Massa)',
  WEIGHT_LOSS = 'Perda de Peso',
  STRENGTH = 'Força',
  ENDURANCE = 'Resistência',
  FLEXIBILITY = 'Flexibilidade',
  GENERAL_HEALTH = 'Saúde Geral'
}

export enum ExperienceLevel {
  BEGINNER = 'Iniciante (0-6 meses)',
  INTERMEDIATE = 'Intermediário (6 meses - 2 anos)',
  ADVANCED = 'Avançado (2+ anos)'
}

export type Language = 'pt' | 'en';
export type WorkoutLocation = 'Gym' | 'Home';

export interface UserProfile {
  name: string;
  age: number;
  gender: 'Masculino' | 'Feminino' | 'Outro';
  height: number; // cm
  weight: number; // kg
  goal: Goal;
  experienceLevel: ExperienceLevel;
  daysPerWeek: number;
  injuries?: string;
  focusAreas?: string[]; // Músculos para priorizar
  workoutLocation: WorkoutLocation;
  language: Language;
  googleSheetUrl?: string; // URL do Web App do Google Apps Script
}

export interface Exercise {
  id: string;
  name: string;
  youtubeVideoId?: string; // ID do vídeo específico (ex: dQw4w9WgXcQ)
  sets: number;
  reps: string; // string to allow "10-12" or "Until failure"
  muscleGroup: string;
  description: string;
  restSeconds: number;
}

export interface WorkoutDay {
  dayName: string; // e.g., "Treino A - Peito e Tríceps" or "Segunda-feira"
  focus: string;
  exercises: Exercise[];
}

export interface WorkoutPlan {
  days: WorkoutDay[];
  summary: string;
}

export interface ExerciseLog {
  exerciseId: string;
  weightUsed: number; // kg
  completed: boolean;
  date: string; // ISO date string YYYY-MM-DD
  calories?: number; // Para cardio
  duration?: number; // Para cardio em minutos
}

export interface AuthData {
  username: string;
  password?: string; // Opcional no estado, obrigatório na requisição
  isAuthenticated: boolean;
  dbUrl?: string;
}

// Treadmill Types
export interface TreadmillSegment {
  duration: number; // seconds
  speed: number; // km/h
  incline: number; // %
  instruction: string; // Text to speak
  phase: 'Warmup' | 'Run' | 'Sprint' | 'Recovery' | 'Cooldown';
}

export interface TreadmillWorkout {
  title: string;
  totalDuration: number; // minutes
  segments: TreadmillSegment[];
}

export interface AppState {
  step: 'auth' | 'onboarding' | 'loading' | 'dashboard' | 'treadmill';
  auth: AuthData;
  profile: UserProfile | null;
  plan: WorkoutPlan | null;
  logs: ExerciseLog[];
  language: Language; // App level language state
}

// Simple Translation Helper
export const t = (key: string, lang: Language): string => {
  const dict: Record<string, { pt: string; en: string }> = {
    // Auth
    'welcome_subtitle': { pt: 'Seu Personal Trainer na Nuvem', en: 'Your Cloud Personal Trainer' },
    'user': { pt: 'Usuário', en: 'Username' },
    'pass': { pt: 'Senha', en: 'Password' },
    'login': { pt: 'Entrar', en: 'Login' },
    'create_account': { pt: 'Criar Conta', en: 'Create Account' },
    'no_account': { pt: 'Não tem conta? Registre-se agora', en: "Don't have an account? Register now" },
    'has_account': { pt: 'Já tem conta? Faça login', en: 'Already have an account? Login' },
    'fill_fields': { pt: 'Preencha usuário e senha.', en: 'Fill in username and password.' },
    'login_fail': { pt: 'Falha no login.', en: 'Login failed.' },
    
    // Onboarding
    'basics': { pt: 'Vamos começar com o básico', en: "Let's start with the basics" },
    'name': { pt: 'Nome', en: 'Name' },
    'age': { pt: 'Idade', en: 'Age' },
    'gender': { pt: 'Gênero', en: 'Gender' },
    'measurements': { pt: 'Suas Medidas', en: 'Your Measurements' },
    'height': { pt: 'Altura (cm)', en: 'Height (cm)' },
    'weight': { pt: 'Peso (kg)', en: 'Weight (kg)' },
    'injuries': { pt: 'Possui lesões?', en: 'Any injuries?' },
    'injuries_ph': { pt: 'Descreva se houver...', en: 'Describe if any...' },
    'personalization': { pt: 'Personalização do Treino', en: 'Workout Customization' },
    'goal': { pt: 'Objetivo Principal', en: 'Main Goal' },
    'exp_level': { pt: 'Nível de Experiência', en: 'Experience Level' },
    'days_week': { pt: 'Dias por semana', en: 'Days per week' },
    'location': { pt: 'Onde você treina?', en: 'Where do you train?' },
    'gym': { pt: 'Academia (Equipamento Completo)', en: 'Gym (Full Equipment)' },
    'home': { pt: 'Em Casa (Peso do corpo / Limitado)', en: 'Home (Bodyweight / Limited)' },
    'focus_area': { pt: 'Foco Muscular (Opcional)', en: 'Muscle Focus (Optional)' },
    'focus_desc': { pt: 'Selecione os músculos que você deseja dar prioridade máxima.', en: 'Select muscles you want to prioritize.' },
    'next': { pt: 'Próximo', en: 'Next' },
    'generate': { pt: 'Gerar Treino', en: 'Generate Workout' },

    // Dashboard
    'hello': { pt: 'Olá', en: 'Hello' },
    'saved': { pt: 'Salvo', en: 'Saved' },
    'saving': { pt: 'Salvando...', en: 'Saving...' },
    'workout_day': { pt: 'Treino', en: 'Workout' },
    'cardio_day': { pt: 'Cardio', en: 'Cardio' },
    'progress': { pt: 'Progresso', en: 'Progress' },
    'suggestion': { pt: 'Sugestão de hoje:', en: "Today's suggestion:" },
    'viewing_other': { pt: 'Você está visualizando outro dia.', en: 'You are viewing another day.' },
    'finish_workout': { pt: 'Concluir Treino de Hoje', en: 'Finish Workout' },
    'finished': { pt: 'Treino Finalizado', en: 'Workout Finished' },
    'congrats': { pt: 'Treino Concluído!', en: 'Workout Completed!' },
    'congrats_msg': { pt: 'Parabéns! Você finalizou o treino.', en: 'Congrats! You finished the workout.' },
    'close': { pt: 'Fechar', en: 'Close' },
    'exercises_done': { pt: 'Exercícios Concluídos', en: 'Exercises Completed' },
    'active_days': { pt: 'Dias Ativos', en: 'Active Days' },
    'freq_chart': { pt: 'Frequência de Treino', en: 'Workout Frequency' },
    'add_exercise': { pt: 'Adicionar Exercício Extra', en: 'Add Extra Exercise' },
    'treadmill_mode': { pt: 'Personal de Esteira', en: 'Treadmill Coach' },

    // Card
    'sets': { pt: 'Séries', en: 'Sets' },
    'reps': { pt: 'Reps', en: 'Reps' },
    'load': { pt: 'Carga (kg)', en: 'Load (kg)' },
    'details': { pt: 'Detalhes', en: 'Details' },
    'execution': { pt: 'Execução', en: 'Execution' },
    'rest': { pt: 'Descanso', en: 'Rest' },
    'muscle': { pt: 'Músculo', en: 'Muscle' },
    'see_video': { pt: 'Ver no YouTube', en: 'Watch on YouTube' },
    'swap_exercise': { pt: 'Trocar Exercício', en: 'Swap Exercise' },
    'confirm_swap': { pt: 'Trocar Exercício?', en: 'Swap Exercise?' },
    'swap_msg': { pt: 'A IA irá gerar uma alternativa para', en: 'AI will generate an alternative for' },
    'cancel': { pt: 'Cancelar', en: 'Cancel' },
    'confirm': { pt: 'Confirmar', en: 'Confirm' },
    'creating': { pt: 'Criando novo exercício...', en: 'Creating new exercise...' },

    // Extras
    'add_modal_title': { pt: 'Adicionar Exercício', en: 'Add Exercise' },
    'manual': { pt: 'Manual', en: 'Manual' },
    'ai_suggest': { pt: 'Sugestão IA', en: 'AI Suggestion' },
    'muscle_target': { pt: 'Músculo Alvo', en: 'Target Muscle' },
    'quantity': { pt: 'Quantidade', en: 'Quantity' },
    'generate_extras': { pt: 'Gerar Exercícios', en: 'Generate Exercises' },
    'exercise_name': { pt: 'Nome do Exercício', en: 'Exercise Name' },
    'desc_optional': { pt: 'Descrição (Opcional)', en: 'Description (Optional)' },
  };

  return dict[key]?.[lang] || key;
};
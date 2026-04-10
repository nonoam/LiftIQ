// Auto-generated types from Supabase schema — keep in sync with migrations

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ─── Enums ───────────────────────────────────────────────────────────────────

export type MovementType = 'compound' | 'isolation';

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'smith_machine'
  | 'bodyweight'
  | 'kettlebell'
  | 'resistance_band'
  | 'ez_bar'
  | 'trap_bar'
  | 'pull_up_bar'
  | 'dip_bars'
  | 'other';

export type Goal = 'strength' | 'hypertrophy' | 'endurance';

export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced';

export type ProgressionType = 'linear' | 'double' | 'undulating';

export type WeightUnit = 'kg' | 'lbs';

export type Theme = 'dark' | 'light' | 'system';

export type MediaType = 'gif' | 'video' | 'image';

export type BodyRegion = 'upper' | 'lower' | 'core';

export type BodySide = 'anterior' | 'posterior' | 'both';

// ─── Tables ──────────────────────────────────────────────────────────────────

export interface MuscleGroup {
  id: string;
  name: string;
  name_es: string | null;
  slug: string;
  body_region: BodyRegion;
  body_side: BodySide | null;
  svg_path_id: string | null;
  color_hex: string;
  created_at: string;
}

export interface Exercise {
  id: string;
  name: string;
  name_es: string | null;
  primary_muscle_group_id: string;
  secondary_muscle_group_ids: string[];
  movement_type: MovementType;
  equipment: Equipment;
  instructions: string | null;
  is_custom: boolean;
  created_by: string | null;
  wger_id: number | null;
  exercisedb_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations (joined)
  primary_muscle_group?: MuscleGroup;
  media?: ExerciseMedia[];
}

export interface ExerciseMedia {
  id: string;
  exercise_id: string;
  media_type: MediaType;
  url: string;
  storage_path: string | null;
  is_primary: boolean;
  created_at: string;
}

export interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  goal: Goal | null;
  experience_level: ExperienceLevel | null;
  default_rest_seconds: number;
  progression_type: ProgressionType;
  weight_unit: WeightUnit;
  theme: Theme;
  notification_reminder: boolean;
  reminder_time: string | null;
  is_premium: boolean;
  onboarding_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface BodyWeightEntry {
  id: string;
  user_id: string;
  weight_kg: number;
  recorded_at: string;
  notes: string | null;
  created_at: string;
}

export interface Routine {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  estimated_duration_minutes: number | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  routine_exercises?: RoutineExercise[];
}

export interface RoutineExercise {
  id: string;
  routine_id: string;
  exercise_id: string;
  position: number;
  target_sets: number;
  target_reps_min: number | null;
  target_reps_max: number | null;
  target_weight_kg: number | null;
  target_rpe: number | null;
  rest_seconds: number;
  notes: string | null;
  created_at: string;
  // Relations
  exercise?: Exercise;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  routine_id: string | null;
  name: string;
  notes: string | null;
  started_at: string;
  finished_at: string | null;
  duration_seconds: number | null;
  body_weight_kg: number | null;
  is_synced: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  workout_sets?: WorkoutSet[];
}

export interface WorkoutSet {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  is_warmup: boolean;
  is_dropset: boolean;
  is_failure: boolean;
  notes: string | null;
  completed_at: string;
  created_at: string;
  // Relations
  exercise?: Exercise;
}

export interface ProgressPrediction {
  id: string;
  user_id: string;
  exercise_id: string;
  suggested_weight_kg: number | null;
  suggested_reps_min: number | null;
  suggested_reps_max: number | null;
  suggested_sets: number | null;
  progression_type: ProgressionType;
  is_deload_suggested: boolean;
  plateau_detected: boolean;
  consecutive_weeks_no_progress: number;
  confidence_score: number | null;
  reasoning: string | null;
  based_on_sessions: number;
  generated_at: string;
  expires_at: string;
  used_at: string | null;
  // Relations
  exercise?: Exercise;
}

export interface AiConversation {
  id: string;
  user_id: string;
  title: string | null;
  messages: Json;
  context: Json | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

// ─── View types ───────────────────────────────────────────────────────────────

export interface UserExerciseHistoryRow {
  user_id: string;
  exercise_id: string;
  exercise_name: string;
  session_id: string;
  started_at: string;
  routine_id: string | null;
  set_id: string;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  is_warmup: boolean;
  is_dropset: boolean;
  is_failure: boolean;
  estimated_1rm: number | null;
  set_volume_kg: number | null;
}

export interface WeeklyVolumeByMuscleRow {
  user_id: string;
  muscle_group_id: string;
  muscle_group_name: string;
  muscle_group_slug: string;
  week_start: string;
  total_volume_kg: number;
  total_sets: number;
  session_count: number;
  training_days: number;
}

// ─── Database type (for Supabase generics) ───────────────────────────────────
// Each table needs Row, Insert, and Update types for Supabase client to infer correctly

type Insertable<T extends { id: string; created_at: string }> = Omit<T, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};
type Updatable<T> = Partial<T>;

export interface Database {
  public: {
    Tables: {
      muscle_groups: {
        Row:    MuscleGroup;
        Insert: Insertable<MuscleGroup>;
        Update: Updatable<MuscleGroup>;
      };
      exercises: {
        Row:    Exercise;
        Insert: Omit<Exercise, 'id' | 'created_at' | 'updated_at' | 'primary_muscle_group' | 'media'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Updatable<Omit<Exercise, 'primary_muscle_group' | 'media'>>;
      };
      exercise_media: {
        Row:    ExerciseMedia;
        Insert: Omit<ExerciseMedia, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Updatable<ExerciseMedia>;
      };
      user_profiles: {
        Row:    UserProfile;
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'> & { created_at?: string; updated_at?: string };
        Update: Updatable<UserProfile>;
      };
      body_weight_history: {
        Row:    BodyWeightEntry;
        Insert: Omit<BodyWeightEntry, 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Updatable<BodyWeightEntry>;
      };
      routines: {
        Row:    Routine;
        Insert: Omit<Routine, 'id' | 'created_at' | 'updated_at' | 'routine_exercises'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Updatable<Omit<Routine, 'routine_exercises'>>;
      };
      routine_exercises: {
        Row:    RoutineExercise;
        Insert: Omit<RoutineExercise, 'id' | 'created_at' | 'exercise'> & { id?: string; created_at?: string };
        Update: Updatable<Omit<RoutineExercise, 'exercise'>>;
      };
      workout_sessions: {
        Row:    WorkoutSession;
        Insert: Omit<WorkoutSession, 'created_at' | 'updated_at' | 'workout_sets'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Updatable<Omit<WorkoutSession, 'workout_sets'>>;
      };
      workout_sets: {
        Row:    WorkoutSet;
        Insert: Omit<WorkoutSet, 'id' | 'created_at' | 'exercise'> & { id?: string; created_at?: string };
        Update: Updatable<Omit<WorkoutSet, 'exercise'>>;
      };
      progress_predictions: {
        Row:    ProgressPrediction;
        Insert: Omit<ProgressPrediction, 'id' | 'generated_at' | 'exercise'> & { id?: string; generated_at?: string };
        Update: Updatable<Omit<ProgressPrediction, 'exercise'>>;
      };
      ai_conversations: {
        Row:    AiConversation;
        Insert: Omit<AiConversation, 'id' | 'created_at' | 'updated_at'> & { id?: string; created_at?: string; updated_at?: string };
        Update: Updatable<AiConversation>;
      };
    };
    Views: {
      user_exercise_history: {
        Row: UserExerciseHistoryRow;
      };
      weekly_volume_by_muscle: {
        Row: WeeklyVolumeByMuscleRow;
      };
    };
    Functions: {
      calculate_estimated_1rm: {
        Args: { weight: number; reps: number };
        Returns: number;
      };
      calculate_epley_1rm: {
        Args: { weight: number; reps: number };
        Returns: number;
      };
      calculate_brzycki_1rm: {
        Args: { weight: number; reps: number };
        Returns: number;
      };
    };
  };
}

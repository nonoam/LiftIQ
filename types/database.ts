export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      exercises: {
        Row: {
          created_at: string
          equipment: Database["public"]["Enums"]["equipment"]
          id: string
          is_active: boolean
          is_custom: boolean
          muscle_group: Database["public"]["Enums"]["muscle_group"]
          name: string
          owner_id: string | null
        }
        Insert: {
          created_at?: string
          equipment: Database["public"]["Enums"]["equipment"]
          id?: string
          is_active?: boolean
          is_custom?: boolean
          muscle_group: Database["public"]["Enums"]["muscle_group"]
          name: string
          owner_id?: string | null
        }
        Update: {
          created_at?: string
          equipment?: Database["public"]["Enums"]["equipment"]
          id?: string
          is_active?: boolean
          is_custom?: boolean
          muscle_group?: Database["public"]["Enums"]["muscle_group"]
          name?: string
          owner_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          default_rest_seconds: number
          display_name: string | null
          id: string
          onboarding_complete: boolean
          updated_at: string
          weight_unit: Database["public"]["Enums"]["weight_unit"]
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          default_rest_seconds?: number
          display_name?: string | null
          id: string
          onboarding_complete?: boolean
          updated_at?: string
          weight_unit?: Database["public"]["Enums"]["weight_unit"]
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          default_rest_seconds?: number
          display_name?: string | null
          id?: string
          onboarding_complete?: boolean
          updated_at?: string
          weight_unit?: Database["public"]["Enums"]["weight_unit"]
        }
        Relationships: []
      }
      routine_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          position: number
          rest_seconds: number | null
          routine_id: string
          target_reps_max: number | null
          target_reps_min: number | null
          target_rir: number | null
          target_sets: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          position: number
          rest_seconds?: number | null
          routine_id: string
          target_reps_max?: number | null
          target_reps_min?: number | null
          target_rir?: number | null
          target_sets?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
          rest_seconds?: number | null
          routine_id?: string
          target_reps_max?: number | null
          target_reps_min?: number | null
          target_rir?: number | null
          target_sets?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_exercises_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean
          name: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean
          name: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          position: number
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          position: number
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_exercise_last_performance"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "v_session_summary"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          created_at: string
          duration_seconds: number | null
          finished_at: string | null
          id: string
          name: string
          notes: string | null
          routine_id: string | null
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          finished_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          routine_id?: string | null
          started_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          finished_at?: string | null
          id?: string
          name?: string
          notes?: string | null
          routine_id?: string | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sets: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          notes: string | null
          reps: number | null
          rir: number | null
          session_exercise_id: string
          set_number: number
          set_type: Database["public"]["Enums"]["set_type"]
          user_id: string
          weight_kg: number | null
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          reps?: number | null
          rir?: number | null
          session_exercise_id: string
          set_number: number
          set_type?: Database["public"]["Enums"]["set_type"]
          user_id: string
          weight_kg?: number | null
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          notes?: string | null
          reps?: number | null
          rir?: number | null
          session_exercise_id?: string
          set_number?: number
          set_type?: Database["public"]["Enums"]["set_type"]
          user_id?: string
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "workout_sets_session_exercise_id_fkey"
            columns: ["session_exercise_id"]
            isOneToOne: false
            referencedRelation: "session_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_exercise_last_performance: {
        Row: {
          exercise_id: string | null
          performed_at: string | null
          session_id: string | null
          sets: Json | null
          top_weight_kg: number | null
          user_id: string | null
          working_sets: number | null
        }
        Relationships: [
          {
            foreignKeyName: "session_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      v_session_summary: {
        Row: {
          duration_seconds: number | null
          exercise_count: number | null
          finished_at: string | null
          name: string | null
          session_id: string | null
          started_at: string | null
          total_volume_kg: number | null
          user_id: string | null
          working_set_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
    }
    Enums: {
      equipment:
        | "barbell"
        | "dumbbell"
        | "machine"
        | "cable"
        | "bodyweight"
        | "kettlebell"
        | "band"
        | "other"
      muscle_group:
        | "chest"
        | "back"
        | "shoulders"
        | "biceps"
        | "triceps"
        | "forearms"
        | "quads"
        | "hamstrings"
        | "glutes"
        | "calves"
        | "core"
        | "full_body"
      set_type: "working" | "warmup" | "dropset" | "failure"
      weight_unit: "kg" | "lb"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      equipment: [
        "barbell",
        "dumbbell",
        "machine",
        "cable",
        "bodyweight",
        "kettlebell",
        "band",
        "other",
      ],
      muscle_group: [
        "chest",
        "back",
        "shoulders",
        "biceps",
        "triceps",
        "forearms",
        "quads",
        "hamstrings",
        "glutes",
        "calves",
        "core",
        "full_body",
      ],
      set_type: ["working", "warmup", "dropset", "failure"],
      weight_unit: ["kg", "lb"],
    },
  },
} as const


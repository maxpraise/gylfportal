export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academy_courses: {
        Row: {
          category: string
          created_at: string
          description: string | null
          duration_hours: number | null
          id: string
          is_published: boolean
          order_index: number
          thumbnail_url: string | null
          title: string
          video_url: string | null
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_published?: boolean
          order_index?: number
          thumbnail_url?: string | null
          title: string
          video_url?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_published?: boolean
          order_index?: number
          thumbnail_url?: string | null
          title?: string
          video_url?: string | null
        }
        Relationships: []
      }
      academy_quizzes: {
        Row: {
          course_id: string
          created_at: string
          id: string
          passing_score: number
          questions: Json
          title: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          passing_score?: number
          questions?: Json
          title: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          passing_score?: number
          questions?: Json
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "academy_quizzes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "academy_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          action: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          profile_id: string
        }
        Insert: {
          action: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          profile_id: string
        }
        Update: {
          action?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connect_meetings: {
        Row: {
          attendees_count: number
          created_at: string
          currency: string | null
          first_timers: number
          id: string
          image_urls: string[] | null
          meeting_date: string
          meeting_title: string
          meeting_type: string
          offering_amount: number | null
          profile_id: string
          summary: string | null
        }
        Insert: {
          attendees_count?: number
          created_at?: string
          currency?: string | null
          first_timers?: number
          id?: string
          image_urls?: string[] | null
          meeting_date: string
          meeting_title: string
          meeting_type?: string
          offering_amount?: number | null
          profile_id: string
          summary?: string | null
        }
        Update: {
          attendees_count?: number
          created_at?: string
          currency?: string | null
          first_timers?: number
          id?: string
          image_urls?: string[] | null
          meeting_date?: string
          meeting_title?: string
          meeting_type?: string
          offering_amount?: number | null
          profile_id?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "connect_meetings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      growth_paths: {
        Row: {
          badge_color: string | null
          created_at: string
          description: string | null
          id: string
          level: number
          min_referrals: number
          name: string
        }
        Insert: {
          badge_color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          level: number
          min_referrals?: number
          name: string
        }
        Update: {
          badge_color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          level?: number
          min_referrals?: number
          name?: string
        }
        Relationships: []
      }
      heart_reports: {
        Row: {
          category: Database["public"]["Enums"]["heart_category"]
          city: string | null
          country: string
          created_at: string
          event_date: string
          id: string
          image_urls: string[] | null
          location_details: string | null
          magazines_shared: number
          outreach_name: string
          profile_id: string
          reach_impact: number
          souls_data_url: string | null
          souls_won: number
          state: string | null
          status: string
          summary: string | null
          testimonies: string | null
          updated_at: string
          youths_data_url: string | null
          youths_incorporated: number
        }
        Insert: {
          category: Database["public"]["Enums"]["heart_category"]
          city?: string | null
          country: string
          created_at?: string
          event_date: string
          id?: string
          image_urls?: string[] | null
          location_details?: string | null
          magazines_shared?: number
          outreach_name: string
          profile_id: string
          reach_impact?: number
          souls_data_url?: string | null
          souls_won?: number
          state?: string | null
          status?: string
          summary?: string | null
          testimonies?: string | null
          updated_at?: string
          youths_data_url?: string | null
          youths_incorporated?: number
        }
        Update: {
          category?: Database["public"]["Enums"]["heart_category"]
          city?: string | null
          country?: string
          created_at?: string
          event_date?: string
          id?: string
          image_urls?: string[] | null
          location_details?: string | null
          magazines_shared?: number
          outreach_name?: string
          profile_id?: string
          reach_impact?: number
          souls_data_url?: string | null
          souls_won?: number
          state?: string | null
          status?: string
          summary?: string | null
          testimonies?: string | null
          updated_at?: string
          youths_data_url?: string | null
          youths_incorporated?: number
        }
        Relationships: [
          {
            foreignKeyName: "heart_reports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_verifications: {
        Row: {
          attempts: number
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_code: string
          otp_type: string
          phone: string | null
          verified: boolean
        }
        Insert: {
          attempts?: number
          created_at?: string
          email: string
          expires_at: string
          id?: string
          otp_code: string
          otp_type?: string
          phone?: string | null
          verified?: boolean
        }
        Update: {
          attempts?: number
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          otp_type?: string
          phone?: string | null
          verified?: boolean
        }
        Relationships: []
      }
      partnerships: {
        Row: {
          amount: number
          category: Database["public"]["Enums"]["giving_category"]
          created_at: string
          currency: string
          id: string
          notes: string | null
          payment_method: string
          profile_id: string
          status: string
          transaction_reference: string | null
        }
        Insert: {
          amount: number
          category: Database["public"]["Enums"]["giving_category"]
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payment_method: string
          profile_id: string
          status?: string
          transaction_reference?: string | null
        }
        Update: {
          amount?: number
          category?: Database["public"]["Enums"]["giving_category"]
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payment_method?: string
          profile_id?: string
          status?: string
          transaction_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partnerships_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prayer_requests: {
        Row: {
          created_at: string
          id: string
          is_anonymous: boolean
          is_answered: boolean
          prayer_count: number
          profile_id: string
          request: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_answered?: boolean
          prayer_count?: number
          profile_id: string
          request: string
        }
        Update: {
          created_at?: string
          id?: string
          is_anonymous?: boolean
          is_answered?: boolean
          prayer_count?: number
          profile_id?: string
          request?: string
        }
        Relationships: [
          {
            foreignKeyName: "prayer_requests_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string | null
          created_at: string
          current_level_id: string | null
          email: string
          full_name: string
          id: string
          phone: string | null
          referral_code: string
          referred_by_profile_id: string | null
          region_id: string | null
          total_referrals: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          current_level_id?: string | null
          email: string
          full_name: string
          id?: string
          phone?: string | null
          referral_code: string
          referred_by_profile_id?: string | null
          region_id?: string | null
          total_referrals?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          country?: string | null
          created_at?: string
          current_level_id?: string | null
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          referral_code?: string
          referred_by_profile_id?: string | null
          region_id?: string | null
          total_referrals?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_current_level_id_fkey"
            columns: ["current_level_id"]
            isOneToOne: false
            referencedRelation: "growth_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_referred_by_profile_id_fkey"
            columns: ["referred_by_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_attempts: {
        Row: {
          answers: Json
          completed_at: string
          id: string
          passed: boolean
          profile_id: string
          quiz_id: string
          score: number
        }
        Insert: {
          answers?: Json
          completed_at?: string
          id?: string
          passed?: boolean
          profile_id: string
          quiz_id: string
          score?: number
        }
        Update: {
          answers?: Json
          completed_at?: string
          id?: string
          passed?: boolean
          profile_id?: string
          quiz_id?: string
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "academy_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_tracking: {
        Row: {
          created_at: string
          id: string
          level: number
          referred_profile_id: string
          referrer_profile_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level?: number
          referred_profile_id: string
          referrer_profile_id: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          referred_profile_id?: string
          referrer_profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_tracking_referred_profile_id_fkey"
            columns: ["referred_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_tracking_referrer_profile_id_fkey"
            columns: ["referrer_profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      regions: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      summit_reports: {
        Row: {
          attendees_count: number
          city: string | null
          country: string
          created_at: string
          description: string | null
          event_date: string
          id: string
          image_urls: string[] | null
          location: string
          new_members: number
          profile_id: string
          souls_won: number
          state: string | null
          status: string
          testimonies: string | null
          title: string
          updated_at: string
        }
        Insert: {
          attendees_count?: number
          city?: string | null
          country: string
          created_at?: string
          description?: string | null
          event_date: string
          id?: string
          image_urls?: string[] | null
          location: string
          new_members?: number
          profile_id: string
          souls_won?: number
          state?: string | null
          status?: string
          testimonies?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          attendees_count?: number
          city?: string | null
          country?: string
          created_at?: string
          description?: string | null
          event_date?: string
          id?: string
          image_urls?: string[] | null
          location?: string
          new_members?: number
          profile_id?: string
          souls_won?: number
          state?: string | null
          status?: string
          testimonies?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "summit_reports_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonies: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_approved: boolean
          is_featured: boolean
          profile_id: string
          testimony: string
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          is_featured?: boolean
          profile_id: string
          testimony: string
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean
          is_featured?: boolean
          profile_id?: string
          testimony?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "testimonies_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_by: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          assigned_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_referral_code: { Args: never; Returns: string }
      get_current_profile_id: { Args: never; Returns: string }
      get_current_region_id: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_referral_count: {
        Args: { profile_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "regional_leader" | "ambassador"
      giving_category:
        | "hslhs"
        | "magazine"
        | "gylf_missions_trips"
        | "offerings"
        | "gylf_conferences"
        | "sponsor_gytv"
        | "gylf_outreaches"
        | "gylf_academy"
      heart_category:
        | "humanitarian"
        | "evangelism"
        | "arts"
        | "representation"
        | "technology"
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
  public: {
    Enums: {
      app_role: ["admin", "regional_leader", "ambassador"],
      giving_category: [
        "hslhs",
        "magazine",
        "gylf_missions_trips",
        "offerings",
        "gylf_conferences",
        "sponsor_gytv",
        "gylf_outreaches",
        "gylf_academy",
      ],
      heart_category: [
        "humanitarian",
        "evangelism",
        "arts",
        "representation",
        "technology",
      ],
    },
  },
} as const

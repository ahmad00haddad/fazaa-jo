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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      area_watch: {
        Row: {
          city: string
          created_at: string
          expires_at: string
          id: string
          user_id: string
          user_name: string
        }
        Insert: {
          city: string
          created_at?: string
          expires_at?: string
          id?: string
          user_id: string
          user_name: string
        }
        Update: {
          city?: string
          created_at?: string
          expires_at?: string
          id?: string
          user_id?: string
          user_name?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          favorite_user_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          favorite_user_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          favorite_user_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      fazaa_requests: {
        Row: {
          category: string
          city: string | null
          created_at: string
          female_only: boolean
          gender_visibility: string | null
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          need: string
          price_jod: number
          requester_gender: string
          requester_name: string
          requester_verified: boolean
          status: string
          urgency: string
          user_id: string
        }
        Insert: {
          category: string
          city?: string | null
          created_at?: string
          female_only?: boolean
          gender_visibility?: string | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          need: string
          price_jod?: number
          requester_gender: string
          requester_name: string
          requester_verified?: boolean
          status?: string
          urgency: string
          user_id: string
        }
        Update: {
          category?: string
          city?: string | null
          created_at?: string
          female_only?: boolean
          gender_visibility?: string | null
          id?: string
          latitude?: number | null
          location?: string | null
          longitude?: number | null
          need?: string
          price_jod?: number
          requester_gender?: string
          requester_name?: string
          requester_verified?: boolean
          status?: string
          urgency?: string
          user_id?: string
        }
        Relationships: []
      }
      fazaa_responses: {
        Row: {
          accepted: boolean | null
          created_at: string
          id: string
          message: string | null
          offered_price_jod: number | null
          request_id: string
          responder_id: string
          responder_name: string
        }
        Insert: {
          accepted?: boolean | null
          created_at?: string
          id?: string
          message?: string | null
          offered_price_jod?: number | null
          request_id: string
          responder_id: string
          responder_name: string
        }
        Update: {
          accepted?: boolean | null
          created_at?: string
          id?: string
          message?: string | null
          offered_price_jod?: number | null
          request_id?: string
          responder_id?: string
          responder_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "fazaa_responses_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "fazaa_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fazaa_responses_responder_id_fkey"
            columns: ["responder_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          link: string | null
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      phone_verifications: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          phone: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string
          id?: string
          phone: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          phone?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          gender: string
          id: string
          name: string
          points: number
          updated_at: string
          verified: boolean
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          gender: string
          id: string
          name: string
          points?: number
          updated_at?: string
          verified?: boolean
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          gender?: string
          id?: string
          name?: string
          points?: number
          updated_at?: string
          verified?: boolean
        }
        Relationships: []
      }
      user_private_data: {
        Row: {
          created_at: string
          phone: string
          phone_verified: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          phone: string
          phone_verified?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          phone?: string
          phone_verified?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_ratings: {
        Row: {
          created_at: string
          id: string
          rater_id: string
          rating: number
          request_id: string
          responder_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rater_id: string
          rating: number
          request_id: string
          responder_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rater_id?: string
          rating?: number
          request_id?: string
          responder_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_ratings_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "fazaa_requests"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_response_rpc: {
        Args: {
          p_request_id: string
          p_responder_id: string
          p_response_id: string
        }
        Returns: undefined
      }
      active_watchers_count: { Args: never; Returns: number }
      complete_my_profile: {
        Args: { p_gender: string; p_name: string; p_phone: string }
        Returns: undefined
      }
      confirm_fazaa_completion: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      ensure_user_private_data: { Args: never; Returns: undefined }
      expire_urgent_fazaa_requests: { Args: never; Returns: number }
      get_my_phone: { Args: never; Returns: string }
      get_responder_phone: { Args: { _responder_id: string }; Returns: string }
      get_user_gender: { Args: { _user_id: string }; Returns: string }
      is_request_owner: {
        Args: { _request_id: string; _user_id: string }
        Returns: boolean
      }
      mark_self_verified: { Args: never; Returns: boolean }
      monthly_top_helper: {
        Args: never
        Returns: {
          city: string
          completed_count: number
          name: string
          points: number
          user_id: string
        }[]
      }
      normalize_jordan_phone: { Args: { p: string }; Returns: string }
      offer_help_rpc: {
        Args: {
          p_message: string
          p_offered_price_jod: number
          p_request_id: string
          p_request_owner_id: string
          p_responder_id: string
          p_responder_name: string
        }
        Returns: undefined
      }
      request_is_female_only: {
        Args: { _request_id: string }
        Returns: boolean
      }
      requests_in_view: {
        Args: {
          max_lat: number
          max_long: number
          min_lat: number
          min_long: number
        }
        Returns: {
          category: string
          city: string | null
          created_at: string
          female_only: boolean
          gender_visibility: string | null
          id: string
          latitude: number | null
          location: string | null
          longitude: number | null
          need: string
          price_jod: number
          requester_gender: string
          requester_name: string
          requester_verified: boolean
          status: string
          urgency: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "fazaa_requests"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      submit_rating: {
        Args: { p_rating: number; p_request_id: string; p_responder_id: string }
        Returns: undefined
      }
      user_completed_count: { Args: { _user_id: string }; Returns: number }
      weekly_leaderboard: {
        Args: { _limit?: number }
        Returns: {
          city: string
          completed_count: number
          name: string
          points: number
          user_id: string
          verified: boolean
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

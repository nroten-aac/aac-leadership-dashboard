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
      attendance: {
        Row: {
          adjusted_total: number
          created_at: string
          event_date: string
          grade_4_6_attendance: number
          id: string
          in_person_total: number
          k3_attendance: number
          month: string
          notes: string | null
          nursery_attendance: number
          online_attendance: number
          quarter: string
          sanctuary_attendance: number
          service: string
          total_adults: number
          total_k6_attendance: number
          volunteer_classroom_attendance: number
          year: number
          youth_attendance: number
        }
        Insert: {
          adjusted_total?: number
          created_at?: string
          event_date: string
          grade_4_6_attendance?: number
          id?: string
          in_person_total?: number
          k3_attendance?: number
          month: string
          notes?: string | null
          nursery_attendance?: number
          online_attendance?: number
          quarter: string
          sanctuary_attendance?: number
          service: string
          total_adults?: number
          total_k6_attendance?: number
          volunteer_classroom_attendance?: number
          year: number
          youth_attendance?: number
        }
        Update: {
          adjusted_total?: number
          created_at?: string
          event_date?: string
          grade_4_6_attendance?: number
          id?: string
          in_person_total?: number
          k3_attendance?: number
          month?: string
          notes?: string | null
          nursery_attendance?: number
          online_attendance?: number
          quarter?: string
          sanctuary_attendance?: number
          service?: string
          total_adults?: number
          total_k6_attendance?: number
          volunteer_classroom_attendance?: number
          year?: number
          youth_attendance?: number
        }
        Relationships: []
      }
      building_campaign: {
        Row: {
          cd_0668: number | null
          cd_1941: number | null
          cd_2029: number | null
          created_at: string
          id: string
          money_market: number | null
          month: string
          monthly_giving_deposits: number
          year: number
        }
        Insert: {
          cd_0668?: number | null
          cd_1941?: number | null
          cd_2029?: number | null
          created_at?: string
          id?: string
          money_market?: number | null
          month: string
          monthly_giving_deposits?: number
          year: number
        }
        Update: {
          cd_0668?: number | null
          cd_1941?: number | null
          cd_2029?: number | null
          created_at?: string
          id?: string
          money_market?: number | null
          month?: string
          monthly_giving_deposits?: number
          year?: number
        }
        Relationships: []
      }
      building_fund_accounts: {
        Row: {
          account_name: string
          amount: number
          created_at: string
          id: string
          month: string
          notes: string | null
          year: number
        }
        Insert: {
          account_name: string
          amount: number
          created_at?: string
          id?: string
          month: string
          notes?: string | null
          year: number
        }
        Update: {
          account_name?: string
          amount?: number
          created_at?: string
          id?: string
          month?: string
          notes?: string | null
          year?: number
        }
        Relationships: []
      }
      discipleship_programs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          leader_name: string | null
          location: string | null
          meeting_day: string | null
          meeting_time: string | null
          name: string
          program_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          leader_name?: string | null
          location?: string | null
          meeting_day?: string | null
          meeting_time?: string | null
          name: string
          program_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          leader_name?: string | null
          location?: string | null
          meeting_day?: string | null
          meeting_time?: string | null
          name?: string
          program_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      donations: {
        Row: {
          amount: number
          created_at: string
          donation_date: string
          donation_type: string
          id: string
          member_id: string | null
          notes: string | null
          payment_method: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          donation_date?: string
          donation_type?: string
          id?: string
          member_id?: string | null
          notes?: string | null
          payment_method?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          donation_date?: string
          donation_type?: string
          id?: string
          member_id?: string | null
          notes?: string | null
          payment_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          accepted_at: string | null
          allowed_tabs: string[]
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          status: string
        }
        Insert: {
          accepted_at?: string | null
          allowed_tabs?: string[]
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          status?: string
        }
        Update: {
          accepted_at?: string | null
          allowed_tabs?: string[]
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          status?: string
        }
        Relationships: []
      }
      member_groups: {
        Row: {
          created_at: string
          group_name: string
          group_type: string
          id: string
          member_id: string
        }
        Insert: {
          created_at?: string
          group_name: string
          group_type?: string
          id?: string
          member_id: string
        }
        Update: {
          created_at?: string
          group_name?: string
          group_type?: string
          id?: string
          member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_groups_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address: string | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          first_name: string
          gender: string | null
          id: string
          last_name: string
          membership_date: string
          membership_status: string
          notes: string | null
          pco_id: string | null
          phone: string | null
          photo_url: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          id?: string
          last_name: string
          membership_date?: string
          membership_status?: string
          notes?: string | null
          pco_id?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          id?: string
          last_name?: string
          membership_date?: string
          membership_status?: string
          notes?: string | null
          pco_id?: string | null
          phone?: string | null
          photo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      monthly_giving: {
        Row: {
          amount: number
          created_at: string
          fund: string
          id: string
          month: string
          notes: string | null
          source: string
          year: number
        }
        Insert: {
          amount: number
          created_at?: string
          fund?: string
          id?: string
          month: string
          notes?: string | null
          source?: string
          year: number
        }
        Update: {
          amount?: number
          created_at?: string
          fund?: string
          id?: string
          month?: string
          notes?: string | null
          source?: string
          year?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      program_enrollments: {
        Row: {
          created_at: string
          enrollment_date: string
          id: string
          member_id: string
          program_id: string
          status: string
        }
        Insert: {
          created_at?: string
          enrollment_date?: string
          id?: string
          member_id: string
          program_id: string
          status?: string
        }
        Update: {
          created_at?: string
          enrollment_date?: string
          id?: string
          member_id?: string
          program_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_enrollments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "discipleship_programs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_tab_permissions: {
        Row: {
          created_at: string
          id: string
          tab_name: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          tab_name: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          tab_name?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "viewer"
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
      app_role: ["admin", "viewer"],
    },
  },
} as const

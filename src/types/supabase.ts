/**
 * Auto-generated file - DO NOT EDIT
 *
 * Generated: 2026-02-27T14:40:38.794Z
 * Project ID: jbhkkxnssbivgznxdjyt
 *
 * To regenerate these types, run:
 *   pnpm run gen:types
 *
 * For more information about Supabase types, see:
 *   https://supabase.com/docs/guides/database/api/generating-types
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1'
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          avatar_url: string | null
          banned_until: string | null
          bio: string | null
          birth_date: string | null
          city: string | null
          company: string | null
          confirmed_at: string | null
          country_code: string | null
          created_at: string | null
          display_name: string
          email: string
          first_name: string | null
          gender: string | null
          id: string
          is_onboarded: boolean | null
          job_title: string | null
          last_name: string | null
          last_sign_in_at: string | null
          locale: string | null
          notification_preferences: Json | null
          phone: string | null
          privacy_settings: Json | null
          providers: string[] | null
          role: Database['public']['Enums']['user_role']
          social_links: Json | null
          state: string | null
          status: string
          theme: string
          timezone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          avatar_url?: string | null
          banned_until?: string | null
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          company?: string | null
          confirmed_at?: string | null
          country_code?: string | null
          created_at?: string | null
          display_name: string
          email: string
          first_name?: string | null
          gender?: string | null
          id: string
          is_onboarded?: boolean | null
          job_title?: string | null
          last_name?: string | null
          last_sign_in_at?: string | null
          locale?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          privacy_settings?: Json | null
          providers?: string[] | null
          role?: Database['public']['Enums']['user_role']
          social_links?: Json | null
          state?: string | null
          status?: string
          theme?: string
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          avatar_url?: string | null
          banned_until?: string | null
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          company?: string | null
          confirmed_at?: string | null
          country_code?: string | null
          created_at?: string | null
          display_name?: string
          email?: string
          first_name?: string | null
          gender?: string | null
          id?: string
          is_onboarded?: boolean | null
          job_title?: string | null
          last_name?: string | null
          last_sign_in_at?: string | null
          locale?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          privacy_settings?: Json | null
          providers?: string[] | null
          role?: Database['public']['Enums']['user_role']
          social_links?: Json | null
          state?: string | null
          status?: string
          theme?: string
          timezone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      fix_sync_issues: {
        Args: {
          dry_run?: boolean
          fix_auth_to_profile?: boolean
          fix_profile_to_auth?: boolean
          user_id_param?: string
        }
        Returns: {
          email: string
          fixes_applied: Json
          status: string
          user_id: string
        }[]
      }
      get_sync_summary: {
        Args: never
        Returns: {
          in_sync_count: number
          most_common_mismatches: Json
          out_of_sync_count: number
          sync_percentage: number
          total_users: number
          users_needing_attention: number
        }[]
      }
      is_avatar_owner: {
        Args: { object_name: string; user_id: string }
        Returns: boolean
      }
      report_profile_auth_sync: {
        Args: never
        Returns: {
          auth_users_updated_at: string
          details: Json
          email: string
          out_of_sync_fields: Json
          profiles_updated_at: string
          sync_status: string
          user_id: string
        }[]
      }
      sync_auth_to_profiles: { Args: never; Returns: undefined }
      sync_profiles_to_auth: { Args: never; Returns: undefined }
      update_user_role: {
        Args: {
          new_role: Database['public']['Enums']['user_role']
          target_user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      user_role: 'user' | 'moderator' | 'admin' | 'root'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ['user', 'moderator', 'admin', 'root'],
    },
  },
} as const

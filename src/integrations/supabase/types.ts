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
      lead_partenaire_assignments: {
        Row: {
          created_at: string
          id: string
          lead_id: string | null
          partenaire_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lead_id?: string | null
          partenaire_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lead_id?: string | null
          partenaire_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_partenaire_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_partenaire_assignments_partenaire_id_fkey"
            columns: ["partenaire_id"]
            isOneToOne: false
            referencedRelation: "partenaire_comptes"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address_line1: string | null
          attempt_id: string | null
          birth_date: string | null
          checklist_states: Json | null
          city: string | null
          consent_marketing: boolean
          cpf_balance_declared: number | null
          cpf_status: string | null
          created_at: string
          date_rdv_prefecture: string | null
          dispense_demandee: boolean | null
          email: string
          employer_support: boolean | null
          estimated_level: string | null
          france_travail_registered: boolean | null
          funding_followup_at: string | null
          funding_internal_notes: string | null
          funding_next_action: string | null
          funding_status: string
          funding_target_date: string | null
          id: string
          lead_intent: string
          metadata: Json
          nationality: string | null
          partenaire_consent: boolean
          partenaire_consent_at: string | null
          postal_code: string | null
          prenom: string | null
          professional_status: string | null
          sector_activity: string | null
          situation_pro: string | null
          source: string
          status: string
          type_demarche: string | null
          whatsapp_phone: string | null
        }
        Insert: {
          address_line1?: string | null
          attempt_id?: string | null
          birth_date?: string | null
          checklist_states?: Json | null
          city?: string | null
          consent_marketing?: boolean
          cpf_balance_declared?: number | null
          cpf_status?: string | null
          created_at?: string
          date_rdv_prefecture?: string | null
          dispense_demandee?: boolean | null
          email: string
          employer_support?: boolean | null
          estimated_level?: string | null
          france_travail_registered?: boolean | null
          funding_followup_at?: string | null
          funding_internal_notes?: string | null
          funding_next_action?: string | null
          funding_status?: string
          funding_target_date?: string | null
          id?: string
          lead_intent?: string
          metadata?: Json
          nationality?: string | null
          partenaire_consent?: boolean
          partenaire_consent_at?: string | null
          postal_code?: string | null
          prenom?: string | null
          professional_status?: string | null
          sector_activity?: string | null
          situation_pro?: string | null
          source?: string
          status?: string
          type_demarche?: string | null
          whatsapp_phone?: string | null
        }
        Update: {
          address_line1?: string | null
          attempt_id?: string | null
          birth_date?: string | null
          checklist_states?: Json | null
          city?: string | null
          consent_marketing?: boolean
          cpf_balance_declared?: number | null
          cpf_status?: string | null
          created_at?: string
          date_rdv_prefecture?: string | null
          dispense_demandee?: boolean | null
          email?: string
          employer_support?: boolean | null
          estimated_level?: string | null
          france_travail_registered?: boolean | null
          funding_followup_at?: string | null
          funding_internal_notes?: string | null
          funding_next_action?: string | null
          funding_status?: string
          funding_target_date?: string | null
          id?: string
          lead_intent?: string
          metadata?: Json
          nationality?: string | null
          partenaire_consent?: boolean
          partenaire_consent_at?: string | null
          postal_code?: string | null
          prenom?: string | null
          professional_status?: string | null
          sector_activity?: string | null
          situation_pro?: string | null
          source?: string
          status?: string
          type_demarche?: string | null
          whatsapp_phone?: string | null
        }
        Relationships: []
      }
      leads_partenaire_status: {
        Row: {
          contacte_at: string | null
          created_at: string
          id: string
          lead_id: string | null
          note: string | null
          partenaire_id: string | null
          statut: string
          updated_at: string
        }
        Insert: {
          contacte_at?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          note?: string | null
          partenaire_id?: string | null
          statut?: string
          updated_at?: string
        }
        Update: {
          contacte_at?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          note?: string | null
          partenaire_id?: string | null
          statut?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_partenaire_status_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_partenaire_status_partenaire_id_fkey"
            columns: ["partenaire_id"]
            isOneToOne: false
            referencedRelation: "partenaire_comptes"
            referencedColumns: ["id"]
          },
        ]
      }
      magic_links: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          lead_id: string | null
          token: string
          used: boolean
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          lead_id?: string | null
          token?: string
          used?: boolean
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          lead_id?: string | null
          token?: string
          used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "magic_links_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      partenaire_comptes: {
        Row: {
          actif: boolean
          created_at: string
          email: string
          id: string
          nom: string | null
          password_hash: string
        }
        Insert: {
          actif?: boolean
          created_at?: string
          email: string
          id?: string
          nom?: string | null
          password_hash: string
        }
        Update: {
          actif?: boolean
          created_at?: string
          email?: string
          id?: string
          nom?: string | null
          password_hash?: string
        }
        Relationships: []
      }
      test_sessions: {
        Row: {
          created_at: string
          duree_secondes: number | null
          flags: Json
          ia_evaluation_consent: boolean | null
          ia_evaluation_consent_at: string | null
          id: string
          lead_id: string | null
          niveau_estime: string | null
          production_feedback: Json | null
          score_production: number | null
          scores: Json
        }
        Insert: {
          created_at?: string
          duree_secondes?: number | null
          flags?: Json
          ia_evaluation_consent?: boolean | null
          ia_evaluation_consent_at?: string | null
          id?: string
          lead_id?: string | null
          niveau_estime?: string | null
          production_feedback?: Json | null
          score_production?: number | null
          scores?: Json
        }
        Update: {
          created_at?: string
          duree_secondes?: number | null
          flags?: Json
          ia_evaluation_consent?: boolean | null
          ia_evaluation_consent_at?: string | null
          id?: string
          lead_id?: string | null
          niveau_estime?: string | null
          production_feedback?: Json | null
          score_production?: number | null
          scores?: Json
        }
        Relationships: [
          {
            foreignKeyName: "test_sessions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  graphql_public: {
    Tables: Record<never, never>;
    Views: Record<never, never>;
    Functions: {
      graphql: {
        Args: {
          extensions?: Json;
          operationName?: string;
          query?: string;
          variables?: Json;
        };
        Returns: Json;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
  public: {
    Tables: {
      auth_otp: {
        Row: {
          created_at: string | null;
          email: string;
          expires_at: string;
          id: string;
          otp_token: string;
          redirect_to: string | null;
          used: boolean | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          expires_at: string;
          id?: string;
          otp_token: string;
          redirect_to?: string | null;
          used?: boolean | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          expires_at?: string;
          id?: string;
          otp_token?: string;
          redirect_to?: string | null;
          used?: boolean | null;
        };
        Relationships: [];
      };
      comments: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          tour_id: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          tour_id: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          tour_id?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "comments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      invitation_otp: {
        Row: {
          created_at: string | null;
          email: string;
          expires_at: string;
          id: string;
          invitation_token: string;
          otp_token: string;
          used: boolean | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          expires_at: string;
          id?: string;
          invitation_token: string;
          otp_token: string;
          used?: boolean | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          expires_at?: string;
          id?: string;
          invitation_token?: string;
          otp_token?: string;
          used?: boolean | null;
        };
        Relationships: [];
      };
      invitations: {
        Row: {
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          inviter_id: string;
          status: Database["public"]["Enums"]["invitation_status"];
          token: string | null;
          tour_id: string;
        };
        Insert: {
          created_at?: string;
          email: string;
          expires_at?: string;
          id?: string;
          inviter_id: string;
          status?: Database["public"]["Enums"]["invitation_status"];
          token?: string | null;
          tour_id: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          inviter_id?: string;
          status?: Database["public"]["Enums"]["invitation_status"];
          token?: string | null;
          tour_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invitations_inviter_id_fkey";
            columns: ["inviter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invitations_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
        ];
      };
      participants: {
        Row: {
          joined_at: string;
          tour_id: string;
          user_id: string;
        };
        Insert: {
          joined_at?: string;
          tour_id: string;
          user_id: string;
        };
        Update: {
          joined_at?: string;
          tour_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "participants_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "participants_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
          language: string;
          onboarding_completed: boolean;
          theme: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          language?: string;
          onboarding_completed?: boolean;
          theme?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          language?: string;
          onboarding_completed?: boolean;
          theme?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tags: {
        Row: {
          id: number;
          name: string;
        };
        Insert: {
          id?: number;
          name: string;
        };
        Update: {
          id?: number;
          name?: string;
        };
        Relationships: [];
      };
      tour_activity: {
        Row: {
          created_at: string;
          id: string;
          last_viewed_at: string;
          tour_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          last_viewed_at?: string;
          tour_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          last_viewed_at?: string;
          tour_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tour_activity_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
        ];
      };
      tour_tags: {
        Row: {
          tag_id: number;
          tour_id: string;
        };
        Insert: {
          tag_id: number;
          tour_id: string;
        };
        Update: {
          tag_id?: number;
          tour_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tour_tags_tag_id_fkey";
            columns: ["tag_id"];
            isOneToOne: false;
            referencedRelation: "tags";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tour_tags_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
        ];
      };
      tours: {
        Row: {
          are_votes_hidden: boolean;
          created_at: string;
          description: string | null;
          destination: string;
          end_date: string;
          id: string;
          like_threshold: number | null;
          owner_id: string;
          participant_limit: number | null;
          start_date: string;
          status: Database["public"]["Enums"]["tour_status"];
          title: string;
          updated_at: string;
          voting_locked: boolean;
        };
        Insert: {
          are_votes_hidden?: boolean;
          created_at?: string;
          description?: string | null;
          destination: string;
          end_date: string;
          id?: string;
          like_threshold?: number | null;
          owner_id: string;
          participant_limit?: number | null;
          start_date: string;
          status?: Database["public"]["Enums"]["tour_status"];
          title: string;
          updated_at?: string;
          voting_locked?: boolean;
        };
        Update: {
          are_votes_hidden?: boolean;
          created_at?: string;
          description?: string | null;
          destination?: string;
          end_date?: string;
          id?: string;
          like_threshold?: number | null;
          owner_id?: string;
          participant_limit?: number | null;
          start_date?: string;
          status?: Database["public"]["Enums"]["tour_status"];
          title?: string;
          updated_at?: string;
          voting_locked?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "tours_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      votes: {
        Row: {
          created_at: string;
          tour_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          tour_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          tour_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "votes_tour_id_fkey";
            columns: ["tour_id"];
            isOneToOne: false;
            referencedRelation: "tours";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "votes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<never, never>;
    Functions: {
      accept_invitation: {
        Args: { accepting_user_id: string; invitation_token: string };
        Returns: string;
      };
      archive_finished_tours: { Args: never; Returns: number };
      cleanup_expired_auth_otps: { Args: never; Returns: undefined };
      cleanup_expired_invitation_otps: { Args: never; Returns: undefined };
      cleanup_expired_invitations: { Args: never; Returns: number };
      cleanup_unconfirmed_users: { Args: never; Returns: undefined };
      create_tour: {
        Args: {
          p_description: string;
          p_destination: string;
          p_end_date: string;
          p_like_threshold?: number;
          p_participant_limit?: number;
          p_start_date: string;
          p_title: string;
        };
        Returns: {
          are_votes_hidden: boolean;
          created_at: string;
          description: string;
          destination: string;
          end_date: string;
          id: string;
          like_threshold: number;
          owner_id: string;
          participant_limit: number;
          start_date: string;
          status: string;
          title: string;
        }[];
      };
      decline_invitation: {
        Args: { declining_user_id: string; invitation_token: string };
        Returns: string;
      };
      get_user_by_email: {
        Args: { search_email: string };
        Returns: {
          created_at: string;
          email: string;
          email_confirmed_at: string;
          id: string;
          raw_app_meta_data: Json;
          raw_user_meta_data: Json;
          updated_at: string;
        }[];
      };
      is_participant: {
        Args: { tour_id_to_check: string; user_id_to_check: string };
        Returns: boolean;
      };
    };
    Enums: {
      invitation_status: "pending" | "accepted" | "declined";
      tour_status: "active" | "archived";
    };
    CompositeTypes: Record<never, never>;
  };
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      invitation_status: ["pending", "accepted", "declined"],
      tour_status: ["active", "archived"],
    },
  },
} as const;

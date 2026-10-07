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
      bible_account_deletion_requests: {
        Row: {
          id: string
          reason: string | null
          requested_at: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          reason?: string | null
          requested_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          reason?: string | null
          requested_at?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      bible_admin_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          detail: Json
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          detail?: Json
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          detail?: Json
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      bible_app_access: {
        Row: {
          active: boolean
          created_at: string
          granted_by: string | null
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          granted_by?: string | null
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          granted_by?: string | null
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bible_assignment_progress: {
        Row: {
          assignment_id: string
          completed_at: string | null
          leader_feedback: string | null
          status: string
          submission: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          completed_at?: string | null
          leader_feedback?: string | null
          status?: string
          submission?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          completed_at?: string | null
          leader_feedback?: string | null
          status?: string
          submission?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_assignment_progress_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "bible_assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_assignment_response_presence: {
        Row: {
          assignment_id: string
          completed_at: string
          congregation_id: string
          display_name: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          completed_at: string
          congregation_id: string
          display_name?: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          completed_at?: string
          congregation_id?: string
          display_name?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_assignment_response_presence_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "bible_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bible_assignment_response_presence_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_assignments: {
        Row: {
          active: boolean
          assignment_type: string
          congregation_id: string
          created_at: string
          created_by: string
          due_at: string | null
          evidence_type: string
          id: string
          instructions: string
          linked_activity: Json
          metadata: Json
          min_quiz_score: number | null
          points: number
          recurrence_rule: string | null
          reminder_at: string | null
          required_reflection: boolean
          schedule_at: string | null
          scripture_refs: string[]
          target_id: string | null
          target_scope: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          assignment_type?: string
          congregation_id: string
          created_at?: string
          created_by: string
          due_at?: string | null
          evidence_type?: string
          id?: string
          instructions?: string
          linked_activity?: Json
          metadata?: Json
          min_quiz_score?: number | null
          points?: number
          recurrence_rule?: string | null
          reminder_at?: string | null
          required_reflection?: boolean
          schedule_at?: string | null
          scripture_refs?: string[]
          target_id?: string | null
          target_scope?: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          assignment_type?: string
          congregation_id?: string
          created_at?: string
          created_by?: string
          due_at?: string | null
          evidence_type?: string
          id?: string
          instructions?: string
          linked_activity?: Json
          metadata?: Json
          min_quiz_score?: number | null
          points?: number
          recurrence_rule?: string | null
          reminder_at?: string | null
          required_reflection?: boolean
          schedule_at?: string | null
          scripture_refs?: string[]
          target_id?: string | null
          target_scope?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_assignments_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_attempts: {
        Row: {
          correct: boolean
          created_at: string
          external_question_id: string | null
          id: number
          question_id: string | null
          response: Json | null
          user_id: string
          xp_earned: number
        }
        Insert: {
          correct: boolean
          created_at?: string
          external_question_id?: string | null
          id?: number
          question_id?: string | null
          response?: Json | null
          user_id: string
          xp_earned?: number
        }
        Update: {
          correct?: boolean
          created_at?: string
          external_question_id?: string | null
          id?: number
          question_id?: string | null
          response?: Json | null
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "bible_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "bible_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_avatar_cosmetics: {
        Row: {
          selected_style: string
          updated_at: string
          user_id: string
        }
        Insert: {
          selected_style?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          selected_style?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bible_badge_catalog: {
        Row: {
          active: boolean
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          name: string
          threshold: Json
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          description: string
          icon: string
          id: string
          name: string
          threshold?: Json
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          name?: string
          threshold?: Json
        }
        Relationships: []
      }
      bible_bookmarks: {
        Row: {
          book_code: string | null
          book_name: string | null
          chapter: number | null
          created_at: string
          id: string
          label: string | null
          user_id: string
          verse_end: number | null
          verse_start: number | null
        }
        Insert: {
          book_code?: string | null
          book_name?: string | null
          chapter?: number | null
          created_at?: string
          id?: string
          label?: string | null
          user_id: string
          verse_end?: number | null
          verse_start?: number | null
        }
        Update: {
          book_code?: string | null
          book_name?: string | null
          chapter?: number | null
          created_at?: string
          id?: string
          label?: string | null
          user_id?: string
          verse_end?: number | null
          verse_start?: number | null
        }
        Relationships: []
      }
      bible_calendar_events: {
        Row: {
          all_day: boolean
          congregation_id: string | null
          created_at: string
          event_date: string
          id: string
          notes: string
          recurrence_weeks: number
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          all_day?: boolean
          congregation_id?: string | null
          created_at?: string
          event_date: string
          id?: string
          notes?: string
          recurrence_weeks?: number
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          all_day?: boolean
          congregation_id?: string | null
          created_at?: string
          event_date?: string
          id?: string
          notes?: string
          recurrence_weeks?: number
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_calendar_events_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_challenge_progress: {
        Row: {
          challenge_id: string
          completed_at: string
          day_key: string
          metadata: Json
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          day_key: string
          metadata?: Json
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          day_key?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_challenge_progress_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "bible_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_challenges: {
        Row: {
          active: boolean
          challenge_type: string
          congregation_id: string
          created_at: string
          created_by: string
          ends_on: string | null
          id: string
          metadata: Json
          starts_on: string
          template_key: string | null
          title: string
        }
        Insert: {
          active?: boolean
          challenge_type?: string
          congregation_id: string
          created_at?: string
          created_by: string
          ends_on?: string | null
          id?: string
          metadata?: Json
          starts_on?: string
          template_key?: string | null
          title: string
        }
        Update: {
          active?: boolean
          challenge_type?: string
          congregation_id?: string
          created_at?: string
          created_by?: string
          ends_on?: string | null
          id?: string
          metadata?: Json
          starts_on?: string
          template_key?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_challenges_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_client_errors: {
        Row: {
          app_version: string | null
          congregation_id: string | null
          context: Json
          created_at: string
          id: number
          message: string
          stack: string | null
          surface: string | null
          user_id: string | null
        }
        Insert: {
          app_version?: string | null
          congregation_id?: string | null
          context?: Json
          created_at?: string
          id?: number
          message: string
          stack?: string | null
          surface?: string | null
          user_id?: string | null
        }
        Update: {
          app_version?: string | null
          congregation_id?: string | null
          context?: Json
          created_at?: string
          id?: number
          message?: string
          stack?: string | null
          surface?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bible_client_errors_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_congregation_invites: {
        Row: {
          active: boolean
          code_hash: string
          congregation_id: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          max_uses: number
          uses: number
        }
        Insert: {
          active?: boolean
          code_hash: string
          congregation_id: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          max_uses?: number
          uses?: number
        }
        Update: {
          active?: boolean
          code_hash?: string
          congregation_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          max_uses?: number
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "bible_congregation_invites_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_congregation_members: {
        Row: {
          active: boolean
          avatar: Json
          congregation_id: string
          display_name: string | null
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          active?: boolean
          avatar?: Json
          congregation_id: string
          display_name?: string | null
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          active?: boolean
          avatar?: Json
          congregation_id?: string
          display_name?: string | null
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_congregation_members_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_congregation_membership_audit: {
        Row: {
          actor_user_id: string
          congregation_id: string
          created_at: string
          id: number
          is_active: boolean
          new_role: string
          old_role: string
          target_user_id: string
          was_active: boolean
        }
        Insert: {
          actor_user_id: string
          congregation_id: string
          created_at?: string
          id?: never
          is_active: boolean
          new_role: string
          old_role: string
          target_user_id: string
          was_active: boolean
        }
        Update: {
          actor_user_id?: string
          congregation_id?: string
          created_at?: string
          id?: never
          is_active?: boolean
          new_role?: string
          old_role?: string
          target_user_id?: string
          was_active?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bible_congregation_membership_audit_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_congregations: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          owner_id: string
          slug: string | null
          timezone: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          owner_id: string
          slug?: string | null
          timezone?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          slug?: string | null
          timezone?: string
        }
        Relationships: []
      }
      bible_content_decisions: {
        Row: {
          congregation_id: string
          content_key: string
          content_ref: string | null
          content_snapshot: Json
          content_type: string
          decision: string
          origin: string
          rationale: string | null
          reviewed_at: string
          reviewed_by: string | null
          updated_at: string
        }
        Insert: {
          congregation_id: string
          content_key: string
          content_ref?: string | null
          content_snapshot?: Json
          content_type?: string
          decision: string
          origin?: string
          rationale?: string | null
          reviewed_at?: string
          reviewed_by?: string | null
          updated_at?: string
        }
        Update: {
          congregation_id?: string
          content_key?: string
          content_ref?: string | null
          content_snapshot?: Json
          content_type?: string
          decision?: string
          origin?: string
          rationale?: string | null
          reviewed_at?: string
          reviewed_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_content_decisions_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_content_escalations: {
        Row: {
          assigned_role: string
          congregation_id: string
          content_key: string
          created_at: string
          id: string
          note: string | null
          raised_by: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_role?: string
          congregation_id: string
          content_key: string
          created_at?: string
          id?: string
          note?: string | null
          raised_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_role?: string
          congregation_id?: string
          content_key?: string
          created_at?: string
          id?: string
          note?: string | null
          raised_by?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_content_escalations_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_content_reports: {
        Row: {
          congregation_id: string
          content_key: string
          content_payload: Json
          content_ref: string | null
          content_source: string
          content_text: string
          content_type: string
          created_at: string
          id: number
          note: string | null
          reason: string
          reporter_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          congregation_id: string
          content_key: string
          content_payload?: Json
          content_ref?: string | null
          content_source?: string
          content_text: string
          content_type?: string
          created_at?: string
          id?: number
          note?: string | null
          reason?: string
          reporter_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          congregation_id?: string
          content_key?: string
          content_payload?: Json
          content_ref?: string | null
          content_source?: string
          content_text?: string
          content_type?: string
          created_at?: string
          id?: number
          note?: string | null
          reason?: string
          reporter_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_content_reports_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_couple_invites: {
        Row: {
          code_hash: string
          created_at: string
          created_by: string
          expires_at: string
          id: string
          pair_id: string
          used_by: string | null
        }
        Insert: {
          code_hash: string
          created_at?: string
          created_by: string
          expires_at: string
          id?: string
          pair_id: string
          used_by?: string | null
        }
        Update: {
          code_hash?: string
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          pair_id?: string
          used_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bible_couple_invites_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "bible_couple_pairs"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_couple_pairs: {
        Row: {
          created_at: string
          id: string
          status: string
          updated_at: string
          user_a: string
          user_b: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_a: string
          user_b?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_a?: string
          user_b?: string | null
        }
        Relationships: []
      }
      bible_couple_shared: {
        Row: {
          author_id: string
          body: string
          completed_at: string | null
          created_at: string
          due_on: string | null
          id: string
          item_type: string
          pair_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          completed_at?: string | null
          created_at?: string
          due_on?: string | null
          id?: string
          item_type?: string
          pair_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          completed_at?: string | null
          created_at?: string
          due_on?: string | null
          id?: string
          item_type?: string
          pair_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_couple_shared_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "bible_couple_pairs"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_daily_journey_status: {
        Row: {
          completed_steps: number
          journey_date: string
          season_key: string | null
          status: string
          total_steps: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_steps?: number
          journey_date: string
          season_key?: string | null
          status?: string
          total_steps?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_steps?: number
          journey_date?: string
          season_key?: string | null
          status?: string
          total_steps?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bible_group_encouragements: {
        Row: {
          created_at: string
          group_id: string
          id: number
          kind: string
          recipient_id: string | null
          sender_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: never
          kind: string
          recipient_id?: string | null
          sender_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: never
          kind?: string
          recipient_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_group_encouragements_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "bible_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_group_members: {
        Row: {
          active: boolean
          group_id: string
          joined_at: string
          role: string
          user_id: string
        }
        Insert: {
          active?: boolean
          group_id: string
          joined_at?: string
          role?: string
          user_id: string
        }
        Update: {
          active?: boolean
          group_id?: string
          joined_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "bible_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_groups: {
        Row: {
          active: boolean
          congregation_id: string | null
          created_at: string
          description: string
          id: string
          invite_code_hash: string | null
          kind: string
          max_members: number
          name: string
          owner_id: string
          schedule_text: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          congregation_id?: string | null
          created_at?: string
          description?: string
          id?: string
          invite_code_hash?: string | null
          kind?: string
          max_members?: number
          name: string
          owner_id: string
          schedule_text?: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          congregation_id?: string | null
          created_at?: string
          description?: string
          id?: string
          invite_code_hash?: string | null
          kind?: string
          max_members?: number
          name?: string
          owner_id?: string
          schedule_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_groups_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_highlights: {
        Row: {
          book_code: string
          book_name: string | null
          chapter: number
          color: string
          created_at: string
          id: string
          user_id: string
          verse_end: number | null
          verse_start: number
        }
        Insert: {
          book_code: string
          book_name?: string | null
          chapter: number
          color?: string
          created_at?: string
          id?: string
          user_id: string
          verse_end?: number | null
          verse_start: number
        }
        Update: {
          book_code?: string
          book_name?: string | null
          chapter?: number
          color?: string
          created_at?: string
          id?: string
          user_id?: string
          verse_end?: number | null
          verse_start?: number
        }
        Relationships: []
      }
      bible_mastery: {
        Row: {
          attempts: number
          correct: number
          next_review_at: string | null
          score: number
          topic: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          correct?: number
          next_review_at?: string | null
          score?: number
          topic: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          correct?: number
          next_review_at?: string | null
          score?: number
          topic?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bible_media_library: {
        Row: {
          active: boolean
          category: string
          congregation_id: string
          cover_path: string | null
          created_at: string
          created_by: string | null
          description: string
          display_order: number
          featured: boolean
          id: string
          media_type: string
          publish_at: string
          title: string
          updated_at: string
          youtube_id: string | null
          youtube_url: string
        }
        Insert: {
          active?: boolean
          category?: string
          congregation_id: string
          cover_path?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          display_order?: number
          featured?: boolean
          id?: string
          media_type?: string
          publish_at?: string
          title: string
          updated_at?: string
          youtube_id?: string | null
          youtube_url: string
        }
        Update: {
          active?: boolean
          category?: string
          congregation_id?: string
          cover_path?: string | null
          created_at?: string
          created_by?: string | null
          description?: string
          display_order?: number
          featured?: boolean
          id?: string
          media_type?: string
          publish_at?: string
          title?: string
          updated_at?: string
          youtube_id?: string | null
          youtube_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_media_library_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_member_recognitions: {
        Row: {
          award_code: string
          awarded_by: string | null
          congregation_id: string
          created_at: string
          icon: string
          id: string
          note: string | null
          title: string
          user_id: string
          visible: boolean
        }
        Insert: {
          award_code: string
          awarded_by?: string | null
          congregation_id: string
          created_at?: string
          icon?: string
          id?: string
          note?: string | null
          title: string
          user_id: string
          visible?: boolean
        }
        Update: {
          award_code?: string
          awarded_by?: string | null
          congregation_id?: string
          created_at?: string
          icon?: string
          id?: string
          note?: string | null
          title?: string
          user_id?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "bible_member_recognitions_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_ministry_calendar: {
        Row: {
          active: boolean
          congregation_id: string
          created_at: string
          created_by: string | null
          description: string
          ends_at: string | null
          event_type: string
          id: string
          linked_id: string | null
          linked_type: string | null
          location_text: string | null
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          congregation_id: string
          created_at?: string
          created_by?: string | null
          description?: string
          ends_at?: string | null
          event_type?: string
          id?: string
          linked_id?: string | null
          linked_type?: string | null
          location_text?: string | null
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          congregation_id?: string
          created_at?: string
          created_by?: string | null
          description?: string
          ends_at?: string | null
          event_type?: string
          id?: string
          linked_id?: string | null
          linked_type?: string | null
          location_text?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_ministry_calendar_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_ministry_messages: {
        Row: {
          active: boolean
          audience_scope: string
          body: string
          congregation_id: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          media_alt: string | null
          media_kind: string
          media_path: string | null
          message_type: string
          pinned: boolean
          publish_at: string
          scripture_refs: Json
          title: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          audience_scope?: string
          body: string
          congregation_id: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          media_alt?: string | null
          media_kind?: string
          media_path?: string | null
          message_type?: string
          pinned?: boolean
          publish_at?: string
          scripture_refs?: Json
          title: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          audience_scope?: string
          body?: string
          congregation_id?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          media_alt?: string | null
          media_kind?: string
          media_path?: string | null
          message_type?: string
          pinned?: boolean
          publish_at?: string
          scripture_refs?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_ministry_messages_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_notification_delivery_preferences: {
        Row: {
          enabled_categories: string[]
          master_enabled: boolean
          quiet_end_minute: number
          quiet_hours_enabled: boolean
          quiet_start_minute: number
          server_enforcement_enabled: boolean
          updated_at: string
          user_id: string
          utc_offset_minutes: number | null
        }
        Insert: {
          enabled_categories?: string[]
          master_enabled?: boolean
          quiet_end_minute?: number
          quiet_hours_enabled?: boolean
          quiet_start_minute?: number
          server_enforcement_enabled?: boolean
          updated_at?: string
          user_id: string
          utc_offset_minutes?: number | null
        }
        Update: {
          enabled_categories?: string[]
          master_enabled?: boolean
          quiet_end_minute?: number
          quiet_hours_enabled?: boolean
          quiet_start_minute?: number
          server_enforcement_enabled?: boolean
          updated_at?: string
          user_id?: string
          utc_offset_minutes?: number | null
        }
        Relationships: []
      }
      bible_notifications: {
        Row: {
          action_kind: string | null
          action_payload: Json
          body: string
          congregation_id: string | null
          created_at: string
          created_by: string | null
          delivery_category: string | null
          expires_at: string | null
          id: string
          notification_type: string
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_kind?: string | null
          action_payload?: Json
          body?: string
          congregation_id?: string | null
          created_at?: string
          created_by?: string | null
          delivery_category?: string | null
          expires_at?: string | null
          id?: string
          notification_type?: string
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_kind?: string | null
          action_payload?: Json
          body?: string
          congregation_id?: string | null
          created_at?: string
          created_by?: string | null
          delivery_category?: string | null
          expires_at?: string | null
          id?: string
          notification_type?: string
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_notifications_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_password_reset_codes: {
        Row: {
          attempts: number
          code_hash: string
          created_at: string
          email_hash: string
          expires_at: string
          id: string
          last_attempt_at: string | null
          locked_until: string | null
          requested_by: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          created_at?: string
          email_hash: string
          expires_at: string
          id?: string
          last_attempt_at?: string | null
          locked_until?: string | null
          requested_by: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          created_at?: string
          email_hash?: string
          expires_at?: string
          id?: string
          last_attempt_at?: string | null
          locked_until?: string | null
          requested_by?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      bible_personality_profiles: {
        Row: {
          assessment_version: string
          completed_at: string | null
          created_at: string
          presentation_profile: Json
          result: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          assessment_version?: string
          completed_at?: string | null
          created_at?: string
          presentation_profile?: Json
          result: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          assessment_version?: string
          completed_at?: string | null
          created_at?: string
          presentation_profile?: Json
          result?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bible_poll_responses: {
        Row: {
          created_at: string
          poll_id: string
          response: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          poll_id: string
          response?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          poll_id?: string
          response?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_poll_responses_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "bible_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_poll_votes: {
        Row: {
          created_at: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          option_index: number
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          option_index?: number
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "bible_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_polls: {
        Row: {
          active: boolean
          anonymous_results: boolean
          closes_at: string | null
          congregation_id: string
          content_class: string
          context: string | null
          created_at: string
          created_by: string | null
          id: string
          options: Json
          poll_type: string
          prompt: string
          results_visibility: string
          scheduled_at: string | null
          scripture_refs: Json | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          anonymous_results?: boolean
          closes_at?: string | null
          congregation_id: string
          content_class?: string
          context?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          options: Json
          poll_type?: string
          prompt: string
          results_visibility?: string
          scheduled_at?: string | null
          scripture_refs?: Json | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          anonymous_results?: boolean
          closes_at?: string | null
          congregation_id?: string
          content_class?: string
          context?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          options?: Json
          poll_type?: string
          prompt?: string
          results_visibility?: string
          scheduled_at?: string | null
          scripture_refs?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_polls_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_presence: {
        Row: {
          congregation_id: string
          last_seen_at: string
          surface: string
          user_id: string
        }
        Insert: {
          congregation_id: string
          last_seen_at?: string
          surface?: string
          user_id: string
        }
        Update: {
          congregation_id?: string
          last_seen_at?: string
          surface?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_presence_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_profiles: {
        Row: {
          church_group: string | null
          created_at: string
          display_name: string | null
          streak: number
          updated_at: string
          user_id: string
          xp: number
        }
        Insert: {
          church_group?: string | null
          created_at?: string
          display_name?: string | null
          streak?: number
          updated_at?: string
          user_id: string
          xp?: number
        }
        Update: {
          church_group?: string | null
          created_at?: string
          display_name?: string | null
          streak?: number
          updated_at?: string
          user_id?: string
          xp?: number
        }
        Relationships: []
      }
      bible_push_delivery_ledger: {
        Row: {
          claimed_at: string
          delivered_at: string | null
          notification_id: string
          subscription_id: string
        }
        Insert: {
          claimed_at?: string
          delivered_at?: string | null
          notification_id: string
          subscription_id: string
        }
        Update: {
          claimed_at?: string
          delivered_at?: string | null
          notification_id?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_push_delivery_ledger_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "bible_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bible_push_delivery_ledger_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "bible_push_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_push_retry_state: {
        Row: {
          failure_count: number
          last_failure_at: string
          next_retry_at: string
          notification_id: string
          subscription_id: string
        }
        Insert: {
          failure_count?: number
          last_failure_at?: string
          next_retry_at: string
          notification_id: string
          subscription_id: string
        }
        Update: {
          failure_count?: number
          last_failure_at?: string
          next_retry_at?: string
          notification_id?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_push_retry_state_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "bible_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bible_push_retry_state_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "bible_push_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          enabled_categories: string[]
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_id: string
          v6_enabled_categories: string[]
        }
        Insert: {
          auth: string
          created_at?: string
          enabled_categories?: string[]
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_id: string
          v6_enabled_categories?: string[]
        }
        Update: {
          auth?: string
          created_at?: string
          enabled_categories?: string[]
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_id?: string
          v6_enabled_categories?: string[]
        }
        Relationships: []
      }
      bible_questions: {
        Row: {
          answer: Json | null
          attribution: string | null
          book: string | null
          chapter: number | null
          choices: Json | null
          content_class: string
          created_at: string
          difficulty: number
          explanation: string | null
          external_id: string | null
          id: string
          license: string | null
          prompt: string
          question_type: string
          reference_text: string | null
          reviewed: boolean
          source_name: string
          source_url: string | null
          source_version: string | null
          verse_end: number | null
          verse_start: number | null
        }
        Insert: {
          answer?: Json | null
          attribution?: string | null
          book?: string | null
          chapter?: number | null
          choices?: Json | null
          content_class?: string
          created_at?: string
          difficulty?: number
          explanation?: string | null
          external_id?: string | null
          id?: string
          license?: string | null
          prompt: string
          question_type: string
          reference_text?: string | null
          reviewed?: boolean
          source_name: string
          source_url?: string | null
          source_version?: string | null
          verse_end?: number | null
          verse_start?: number | null
        }
        Update: {
          answer?: Json | null
          attribution?: string | null
          book?: string | null
          chapter?: number | null
          choices?: Json | null
          content_class?: string
          created_at?: string
          difficulty?: number
          explanation?: string | null
          external_id?: string | null
          id?: string
          license?: string | null
          prompt?: string
          question_type?: string
          reference_text?: string | null
          reviewed?: boolean
          source_name?: string
          source_url?: string | null
          source_version?: string | null
          verse_end?: number | null
          verse_start?: number | null
        }
        Relationships: []
      }
      bible_room_responses: {
        Row: {
          created_at: string
          id: string
          points: number
          response: Json
          round_no: number
          session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          points?: number
          response?: Json
          round_no?: number
          session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          points?: number
          response?: Json
          round_no?: number
          session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_room_responses_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "bible_shared_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_score_events: {
        Row: {
          category: string
          congregation_id: string
          created_at: string
          id: number
          metadata: Json
          points: number
          source: string
          source_event_id: string | null
          team_id: string | null
          user_id: string
        }
        Insert: {
          category: string
          congregation_id: string
          created_at?: string
          id?: number
          metadata?: Json
          points: number
          source: string
          source_event_id?: string | null
          team_id?: string | null
          user_id: string
        }
        Update: {
          category?: string
          congregation_id?: string
          created_at?: string
          id?: number
          metadata?: Json
          points?: number
          source?: string
          source_event_id?: string | null
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_score_events_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bible_score_events_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "bible_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_session_participants: {
        Row: {
          created_at: string
          participation_points: number
          session_id: string
          team_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          participation_points?: number
          session_id: string
          team_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          participation_points?: number
          session_id?: string
          team_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_session_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "bible_shared_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bible_session_participants_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "bible_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_shared_sessions: {
        Row: {
          congregation_id: string
          created_by: string | null
          ended_at: string | null
          id: string
          metadata: Json
          room_code: string | null
          session_type: string
          started_at: string
          state: Json
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          congregation_id: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json
          room_code?: string | null
          session_type: string
          started_at?: string
          state?: Json
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          congregation_id?: string
          created_by?: string | null
          ended_at?: string | null
          id?: string
          metadata?: Json
          room_code?: string | null
          session_type?: string
          started_at?: string
          state?: Json
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_shared_sessions_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_signup_limits: {
        Row: {
          attempts: number
          ip_hash: string
          updated_at: string
          window_start: string
        }
        Insert: {
          attempts?: number
          ip_hash: string
          updated_at?: string
          window_start: string
        }
        Update: {
          attempts?: number
          ip_hash?: string
          updated_at?: string
          window_start?: string
        }
        Relationships: []
      }
      bible_team_members: {
        Row: {
          joined_at: string
          team_id: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          team_id: string
          user_id: string
        }
        Update: {
          joined_at?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "bible_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_teams: {
        Row: {
          active: boolean
          congregation_id: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          team_type: string
        }
        Insert: {
          active?: boolean
          congregation_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          team_type: string
        }
        Update: {
          active?: boolean
          congregation_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          team_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_teams_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_telemetry_events: {
        Row: {
          event_name: string
          feature: string
          id: number
          occurred_at: string
          properties: Json
          route: string
          session_id: string
          user_id: string | null
          visitor_id: string
        }
        Insert: {
          event_name: string
          feature: string
          id?: number
          occurred_at?: string
          properties?: Json
          route: string
          session_id: string
          user_id?: string | null
          visitor_id: string
        }
        Update: {
          event_name?: string
          feature?: string
          id?: number
          occurred_at?: string
          properties?: Json
          route?: string
          session_id?: string
          user_id?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_telemetry_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "bible_telemetry_sessions"
            referencedColumns: ["session_id"]
          },
          {
            foreignKeyName: "bible_telemetry_events_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "bible_telemetry_visitors"
            referencedColumns: ["visitor_id"]
          },
        ]
      }
      bible_telemetry_sessions: {
        Row: {
          app_version: string
          authenticated_at: string | null
          ended_at: string | null
          entry_route: string
          event_count: number
          is_pwa: boolean
          last_route: string
          last_seen_at: string
          locale: string
          platform: string
          screen_bucket: string
          session_id: string
          started_at: string
          started_user_id: string | null
          user_id: string | null
          visitor_id: string
        }
        Insert: {
          app_version?: string
          authenticated_at?: string | null
          ended_at?: string | null
          entry_route?: string
          event_count?: number
          is_pwa?: boolean
          last_route?: string
          last_seen_at?: string
          locale?: string
          platform?: string
          screen_bucket?: string
          session_id: string
          started_at?: string
          started_user_id?: string | null
          user_id?: string | null
          visitor_id: string
        }
        Update: {
          app_version?: string
          authenticated_at?: string | null
          ended_at?: string | null
          entry_route?: string
          event_count?: number
          is_pwa?: boolean
          last_route?: string
          last_seen_at?: string
          locale?: string
          platform?: string
          screen_bucket?: string
          session_id?: string
          started_at?: string
          started_user_id?: string | null
          user_id?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_telemetry_sessions_visitor_id_fkey"
            columns: ["visitor_id"]
            isOneToOne: false
            referencedRelation: "bible_telemetry_visitors"
            referencedColumns: ["visitor_id"]
          },
        ]
      }
      bible_telemetry_visitors: {
        Row: {
          app_version: string
          first_route: string
          first_seen_at: string
          first_user_id: string | null
          is_pwa: boolean
          last_route: string
          last_seen_at: string
          last_user_id: string | null
          locale: string
          platform: string
          screen_bucket: string
          visitor_id: string
        }
        Insert: {
          app_version?: string
          first_route?: string
          first_seen_at?: string
          first_user_id?: string | null
          is_pwa?: boolean
          last_route?: string
          last_seen_at?: string
          last_user_id?: string | null
          locale?: string
          platform?: string
          screen_bucket?: string
          visitor_id: string
        }
        Update: {
          app_version?: string
          first_route?: string
          first_seen_at?: string
          first_user_id?: string | null
          is_pwa?: boolean
          last_route?: string
          last_seen_at?: string
          last_user_id?: string | null
          locale?: string
          platform?: string
          screen_bucket?: string
          visitor_id?: string
        }
        Relationships: []
      }
      bible_user_badges: {
        Row: {
          badge_id: string
          congregation_id: string
          earned_at: string
          metadata: Json
          user_id: string
        }
        Insert: {
          badge_id: string
          congregation_id: string
          earned_at?: string
          metadata?: Json
          user_id: string
        }
        Update: {
          badge_id?: string
          congregation_id?: string
          earned_at?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bible_user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "bible_badge_catalog"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bible_user_badges_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      bible_user_learning_profile: {
        Row: {
          preferred_depth: string
          reasoning_tendencies: Json
          updated_at: string
          user_id: string
          weak_topics: Json
        }
        Insert: {
          preferred_depth?: string
          reasoning_tendencies?: Json
          updated_at?: string
          user_id: string
          weak_topics?: Json
        }
        Update: {
          preferred_depth?: string
          reasoning_tendencies?: Json
          updated_at?: string
          user_id?: string
          weak_topics?: Json
        }
        Relationships: []
      }
      v7_learner_progress: {
        Row: {
          assignment_id: string
          completed_at: string | null
          current_step_id: string | null
          id: string
          learner_id: string
          lesson_revision_id: string
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          assignment_id: string
          completed_at?: string | null
          current_step_id?: string | null
          id?: string
          learner_id: string
          lesson_revision_id: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          completed_at?: string | null
          current_step_id?: string | null
          id?: string
          learner_id?: string
          lesson_revision_id?: string
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "v7_learner_progress_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "v7_pair_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "v7_learner_progress_assignment_id_lesson_revision_id_fkey"
            columns: ["assignment_id", "lesson_revision_id"]
            isOneToOne: false
            referencedRelation: "v7_pair_assignments"
            referencedColumns: ["id", "lesson_revision_id"]
          },
          {
            foreignKeyName: "v7_learner_progress_current_step_id_lesson_revision_id_fkey"
            columns: ["current_step_id", "lesson_revision_id"]
            isOneToOne: false
            referencedRelation: "v7_lesson_steps"
            referencedColumns: ["id", "lesson_revision_id"]
          },
        ]
      }
      v7_lesson_responses: {
        Row: {
          assignment_id: string
          created_at: string
          id: string
          learner_id: string
          lesson_revision_id: string
          lesson_step_id: string
          response: Json
          updated_at: string
        }
        Insert: {
          assignment_id: string
          created_at?: string
          id?: string
          learner_id: string
          lesson_revision_id: string
          lesson_step_id: string
          response: Json
          updated_at?: string
        }
        Update: {
          assignment_id?: string
          created_at?: string
          id?: string
          learner_id?: string
          lesson_revision_id?: string
          lesson_step_id?: string
          response?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "v7_lesson_responses_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "v7_pair_assignments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "v7_lesson_responses_lesson_revision_id_fkey"
            columns: ["lesson_revision_id"]
            isOneToOne: false
            referencedRelation: "v7_lesson_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "v7_lesson_responses_lesson_step_id_lesson_revision_id_fkey"
            columns: ["lesson_step_id", "lesson_revision_id"]
            isOneToOne: false
            referencedRelation: "v7_lesson_steps"
            referencedColumns: ["id", "lesson_revision_id"]
          },
        ]
      }
      v7_lesson_revisions: {
        Row: {
          created_at: string
          created_by: string
          id: string
          lesson_id: string
          locale: string
          published_at: string | null
          revision_number: number
          summary: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          lesson_id: string
          locale: string
          published_at?: string | null
          revision_number: number
          summary?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          lesson_id?: string
          locale?: string
          published_at?: string | null
          revision_number?: number
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "v7_lesson_revisions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "v7_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      v7_lesson_steps: {
        Row: {
          content: Json
          created_at: string
          id: string
          lesson_revision_id: string
          library_revision_id: string | null
          position: number
          scripture_refs: Json
          step_type: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id?: string
          lesson_revision_id: string
          library_revision_id?: string | null
          position: number
          scripture_refs?: Json
          step_type: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          lesson_revision_id?: string
          library_revision_id?: string | null
          position?: number
          scripture_refs?: Json
          step_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "v7_lesson_steps_lesson_revision_id_fkey"
            columns: ["lesson_revision_id"]
            isOneToOne: false
            referencedRelation: "v7_lesson_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "v7_lesson_steps_library_revision_id_fkey"
            columns: ["library_revision_id"]
            isOneToOne: false
            referencedRelation: "v7_library_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      v7_lessons: {
        Row: {
          created_at: string
          display_order: number
          id: string
          module_id: string
          publication_state: string
          revision_id: string
          title: string
        }
        Insert: {
          created_at?: string
          display_order: number
          id?: string
          module_id: string
          publication_state?: string
          revision_id?: string
          title: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          module_id?: string
          publication_state?: string
          revision_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "v7_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "v7_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      v7_library_items: {
        Row: {
          congregation_id: string | null
          content_type: string
          created_at: string
          created_by: string
          current_revision_id: string | null
          id: string
          publication_state: string
          updated_at: string
        }
        Insert: {
          congregation_id?: string | null
          content_type: string
          created_at?: string
          created_by: string
          current_revision_id?: string | null
          id?: string
          publication_state?: string
          updated_at?: string
        }
        Update: {
          congregation_id?: string | null
          content_type?: string
          created_at?: string
          created_by?: string
          current_revision_id?: string | null
          id?: string
          publication_state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "v7_library_items_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "v7_library_items_current_revision_fk"
            columns: ["current_revision_id", "id"]
            isOneToOne: false
            referencedRelation: "v7_library_revisions"
            referencedColumns: ["id", "item_id"]
          },
        ]
      }
      v7_library_review_decisions: {
        Row: {
          content_type: string
          created_at: string
          criteria: Json
          decided_at: string
          decision: string
          evidence_refs: Json
          id: number
          item_id: string
          note: string | null
          policy_id: string | null
          policy_version: string | null
          reviewer_id: string | null
          reviewer_type: string
          revision_id: string
          second_pass: Json
        }
        Insert: {
          content_type: string
          created_at?: string
          criteria?: Json
          decided_at: string
          decision: string
          evidence_refs?: Json
          id?: never
          item_id: string
          note?: string | null
          policy_id?: string | null
          policy_version?: string | null
          reviewer_id?: string | null
          reviewer_type: string
          revision_id: string
          second_pass?: Json
        }
        Update: {
          content_type?: string
          created_at?: string
          criteria?: Json
          decided_at?: string
          decision?: string
          evidence_refs?: Json
          id?: never
          item_id?: string
          note?: string | null
          policy_id?: string | null
          policy_version?: string | null
          reviewer_id?: string | null
          reviewer_type?: string
          revision_id?: string
          second_pass?: Json
        }
        Relationships: [
          {
            foreignKeyName: "v7_library_review_decisions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "v7_library_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "v7_library_review_decisions_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "v7_library_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "v7_library_review_decisions_revision_id_item_id_fkey"
            columns: ["revision_id", "item_id"]
            isOneToOne: false
            referencedRelation: "v7_library_revisions"
            referencedColumns: ["id", "item_id"]
          },
        ]
      }
      v7_library_revision_taxonomy: {
        Row: {
          display_order: number
          revision_id: string
          taxonomy_id: string
        }
        Insert: {
          display_order: number
          revision_id: string
          taxonomy_id: string
        }
        Update: {
          display_order?: number
          revision_id?: string
          taxonomy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "v7_library_revision_taxonomy_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "v7_library_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "v7_library_revision_taxonomy_taxonomy_id_fkey"
            columns: ["taxonomy_id"]
            isOneToOne: false
            referencedRelation: "v7_library_taxonomy"
            referencedColumns: ["id"]
          },
        ]
      }
      v7_library_revisions: {
        Row: {
          allowed_uses: Json
          attribution: string
          body: Json
          created_at: string
          created_by: string
          creator: string | null
          derivatives: string[]
          id: string
          item_id: string
          originating_organization: string | null
          publication_state: string
          reading_minutes: number | null
          review_evidence: Json
          review_policy_id: string | null
          review_policy_version: string | null
          review_status: string
          reviewed_at: string | null
          reviewer_id: string | null
          reviewer_type: string | null
          revision_history: string[]
          revision_number: number
          rights_basis: string | null
          rights_holder: string | null
          rights_status: string
          source_catalog_id: string | null
          source_checksum: string | null
          source_date: string | null
          source_kind: string
          source_locale: string
          source_revision: string | null
          source_title: string
          source_uri: string | null
          summary: string
          title: string
          withdrawal_reason: string | null
        }
        Insert: {
          allowed_uses?: Json
          attribution?: string
          body?: Json
          created_at?: string
          created_by: string
          creator?: string | null
          derivatives?: string[]
          id?: string
          item_id: string
          originating_organization?: string | null
          publication_state?: string
          reading_minutes?: number | null
          review_evidence?: Json
          review_policy_id?: string | null
          review_policy_version?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_type?: string | null
          revision_history?: string[]
          revision_number: number
          rights_basis?: string | null
          rights_holder?: string | null
          rights_status: string
          source_catalog_id?: string | null
          source_checksum?: string | null
          source_date?: string | null
          source_kind: string
          source_locale: string
          source_revision?: string | null
          source_title: string
          source_uri?: string | null
          summary?: string
          title: string
          withdrawal_reason?: string | null
        }
        Update: {
          allowed_uses?: Json
          attribution?: string
          body?: Json
          created_at?: string
          created_by?: string
          creator?: string | null
          derivatives?: string[]
          id?: string
          item_id?: string
          originating_organization?: string | null
          publication_state?: string
          reading_minutes?: number | null
          review_evidence?: Json
          review_policy_id?: string | null
          review_policy_version?: string | null
          review_status?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          reviewer_type?: string | null
          revision_history?: string[]
          revision_number?: number
          rights_basis?: string | null
          rights_holder?: string | null
          rights_status?: string
          source_catalog_id?: string | null
          source_checksum?: string | null
          source_date?: string | null
          source_kind?: string
          source_locale?: string
          source_revision?: string | null
          source_title?: string
          source_uri?: string | null
          summary?: string
          title?: string
          withdrawal_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "v7_library_revisions_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "v7_library_items"
            referencedColumns: ["id"]
          },
        ]
      }
      v7_library_taxonomy: {
        Row: {
          congregation_id: string | null
          created_at: string
          created_by: string
          id: string
          kind: string
          labels: Json
        }
        Insert: {
          congregation_id?: string | null
          created_at?: string
          created_by: string
          id: string
          kind: string
          labels: Json
        }
        Update: {
          congregation_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          kind?: string
          labels?: Json
        }
        Relationships: [
          {
            foreignKeyName: "v7_library_taxonomy_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      v7_library_translations: {
        Row: {
          body: Json
          created_at: string
          id: string
          locale: string
          review_status: string
          reviewed_at: string | null
          reviewer_id: string | null
          revision_id: string
          summary: string
          title: string
          translated_from_revision_id: string
          translator: string
        }
        Insert: {
          body?: Json
          created_at?: string
          id?: string
          locale: string
          review_status?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          revision_id: string
          summary?: string
          title: string
          translated_from_revision_id: string
          translator: string
        }
        Update: {
          body?: Json
          created_at?: string
          id?: string
          locale?: string
          review_status?: string
          reviewed_at?: string | null
          reviewer_id?: string | null
          revision_id?: string
          summary?: string
          title?: string
          translated_from_revision_id?: string
          translator?: string
        }
        Relationships: [
          {
            foreignKeyName: "v7_library_translations_revision_id_fkey"
            columns: ["revision_id"]
            isOneToOne: false
            referencedRelation: "v7_library_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "v7_library_translations_translated_from_revision_id_fkey"
            columns: ["translated_from_revision_id"]
            isOneToOne: false
            referencedRelation: "v7_library_revisions"
            referencedColumns: ["id"]
          },
        ]
      }
      v7_mentor_pairs: {
        Row: {
          congregation_id: string
          created_at: string
          ended_at: string | null
          id: string
          initiated_by: string
          mentee_accepted_at: string | null
          mentee_id: string
          mentor_accepted_at: string | null
          mentor_id: string
          state: string
          updated_at: string
        }
        Insert: {
          congregation_id: string
          created_at?: string
          ended_at?: string | null
          id?: string
          initiated_by: string
          mentee_accepted_at?: string | null
          mentee_id: string
          mentor_accepted_at?: string | null
          mentor_id: string
          state?: string
          updated_at?: string
        }
        Update: {
          congregation_id?: string
          created_at?: string
          ended_at?: string | null
          id?: string
          initiated_by?: string
          mentee_accepted_at?: string | null
          mentee_id?: string
          mentor_accepted_at?: string | null
          mentor_id?: string
          state?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "v7_mentor_pairs_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
      v7_modules: {
        Row: {
          created_at: string
          display_order: number
          id: string
          publication_state: string
          revision_id: string
          summary: string
          title: string
          track_id: string
        }
        Insert: {
          created_at?: string
          display_order: number
          id?: string
          publication_state?: string
          revision_id?: string
          summary?: string
          title: string
          track_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          publication_state?: string
          revision_id?: string
          summary?: string
          title?: string
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "v7_modules_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "v7_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      v7_pair_assignments: {
        Row: {
          assigned_by: string
          created_at: string
          due_at: string | null
          id: string
          lesson_revision_id: string
          pair_id: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_by: string
          created_at?: string
          due_at?: string | null
          id?: string
          lesson_revision_id: string
          pair_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string
          created_at?: string
          due_at?: string | null
          id?: string
          lesson_revision_id?: string
          pair_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "v7_pair_assignments_lesson_revision_id_fkey"
            columns: ["lesson_revision_id"]
            isOneToOne: false
            referencedRelation: "v7_lesson_revisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "v7_pair_assignments_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "v7_mentor_pairs"
            referencedColumns: ["id"]
          },
        ]
      }
      v7_pair_events: {
        Row: {
          actor_id: string | null
          created_at: string
          event_type: string
          id: number
          metadata: Json
          pair_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          event_type: string
          id?: never
          metadata?: Json
          pair_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          event_type?: string
          id?: never
          metadata?: Json
          pair_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "v7_pair_events_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "v7_mentor_pairs"
            referencedColumns: ["id"]
          },
        ]
      }
      v7_response_shares: {
        Row: {
          created_at: string
          id: string
          recipient_id: string
          response_id: string
          revoked_at: string | null
          share_state: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipient_id: string
          response_id: string
          revoked_at?: string | null
          share_state?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipient_id?: string
          response_id?: string
          revoked_at?: string | null
          share_state?: string
        }
        Relationships: [
          {
            foreignKeyName: "v7_response_shares_response_id_fkey"
            columns: ["response_id"]
            isOneToOne: false
            referencedRelation: "v7_lesson_responses"
            referencedColumns: ["id"]
          },
        ]
      }
      v7_tracks: {
        Row: {
          audience: string
          congregation_id: string | null
          created_at: string
          created_by: string
          display_order: number
          id: string
          locale: string
          publication_state: string
          revision_id: string
          summary: string
          title: string
          updated_at: string
        }
        Insert: {
          audience?: string
          congregation_id?: string | null
          created_at?: string
          created_by: string
          display_order?: number
          id?: string
          locale: string
          publication_state?: string
          revision_id?: string
          summary?: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          congregation_id?: string | null
          created_at?: string
          created_by?: string
          display_order?: number
          id?: string
          locale?: string
          publication_state?: string
          revision_id?: string
          summary?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "v7_tracks_congregation_id_fkey"
            columns: ["congregation_id"]
            isOneToOne: false
            referencedRelation: "bible_congregations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      bible_telemetry_daily: {
        Row: {
          avg_session_minutes: number | null
          day: string | null
          events: number | null
          guest_only_sessions: number | null
          guest_to_registered_sessions: number | null
          registered_users: number | null
          sessions: number | null
          visitors: number | null
        }
        Relationships: []
      }
      bible_telemetry_feature_daily: {
        Row: {
          day: string | null
          event_name: string | null
          events: number | null
          feature: string | null
          registered_users: number | null
          visitors: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      bible_claim_push_delivery: {
        Args: { target_notification: string; target_subscription: string }
        Returns: boolean
      }
      bible_claim_push_delivery_rate_limited: {
        Args: { target_notification: string; target_subscription: string }
        Returns: boolean
      }
      bible_claim_push_delivery_v6: {
        Args: {
          target_local_minute: number
          target_notification: string
          target_subscription: string
        }
        Returns: boolean
      }
      bible_claim_push_delivery_v6_rate_limited: {
        Args: {
          target_local_minute: number
          target_notification: string
          target_subscription: string
        }
        Returns: boolean
      }
      bible_clear_push_retry_state: {
        Args: { target_notification: string; target_subscription: string }
        Returns: boolean
      }
      bible_enqueue_assignment_due_notifications_v6: {
        Args: never
        Returns: {
          notification_id: string
        }[]
      }
      bible_leaderboard: {
        Args: { p_congregation: string; p_since?: string }
        Returns: {
          category: string
          points: number
          user_id: string
        }[]
      }
      bible_manage_congregation_member_v6: {
        Args: {
          p_active: boolean
          p_actor_user_id: string
          p_congregation_id: string
          p_role: string
          p_target_user_id: string
        }
        Returns: Json
      }
      bible_poll_aggregate_v2: { Args: { p_poll: string }; Returns: Json }
      bible_poll_totals: {
        Args: { p_poll: string }
        Returns: {
          option_index: number
          total: number
        }[]
      }
      bible_presence_active_count: {
        Args: { target_congregation: string; window_minutes?: number }
        Returns: number
      }
      bible_prune_telemetry: { Args: { p_before?: string }; Returns: Json }
      bible_record_push_retry_failure: {
        Args: { target_notification: string; target_subscription: string }
        Returns: number
      }
      bible_record_telemetry_batch: {
        Args: {
          p_context?: Json
          p_events?: Json
          p_session_id: string
          p_visitor_id: string
        }
        Returns: Json
      }
      bible_retire_push_subscription: {
        Args: {
          expected_auth: string
          expected_endpoint: string
          expected_p256dh: string
          target_subscription: string
          target_user: string
        }
        Returns: boolean
      }
      bible_revoke_auth_sessions: {
        Args: { target_user_id: string }
        Returns: number
      }
      bible_v7_apply_automated_library_review: {
        Args: {
          p_criteria: Json
          p_decided_at: string
          p_decision: string
          p_evidence_refs: Json
          p_item_id: string
          p_note?: string
          p_policy_id: string
          p_policy_version: string
          p_revision_id: string
          p_second_pass: Json
        }
        Returns: {
          content_type: string
          created_at: string
          criteria: Json
          decided_at: string
          decision: string
          evidence_refs: Json
          id: number
          item_id: string
          note: string | null
          policy_id: string | null
          policy_version: string | null
          reviewer_id: string | null
          reviewer_type: string
          revision_id: string
          second_pass: Json
        }
        SetofOptions: {
          from: "*"
          to: "v7_library_review_decisions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      bible_v7_apply_human_library_review: {
        Args: {
          p_decided_at: string
          p_decision: string
          p_item_id: string
          p_note?: string
          p_revision_id: string
        }
        Returns: {
          content_type: string
          created_at: string
          criteria: Json
          decided_at: string
          decision: string
          evidence_refs: Json
          id: number
          item_id: string
          note: string | null
          policy_id: string | null
          policy_version: string | null
          reviewer_id: string | null
          reviewer_type: string
          revision_id: string
          second_pass: Json
        }
        SetofOptions: {
          from: "*"
          to: "v7_library_review_decisions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      bible_v7_create_pair_assignment: {
        Args: {
          p_lesson_id: string
          p_lesson_revision_id: string
          p_module_id: string
          p_pair_id: string
          p_track_id: string
        }
        Returns: {
          assignment_id: string
          assignment_status: string
        }[]
      }
      bible_v7_publish_curriculum_path: {
        Args: {
          p_congregation_id: string
          p_expected_lesson_revision_id: string
          p_expected_module_revision_id: string
          p_expected_track_revision_id: string
          p_lesson_id: string
          p_lesson_revision_id: string
          p_library_revision_ids?: string[]
          p_module_id: string
          p_track_id: string
        }
        Returns: {
          congregation_id: string
          lesson_id: string
          lesson_publication_state: string
          lesson_revision_id: string
          module_id: string
          module_publication_state: string
          published_at: string
          track_id: string
          track_publication_state: string
        }[]
      }
      bible_v7_transition_mentor_pair: {
        Args: { p_action: string; p_pair_id: string }
        Returns: {
          congregation_id: string
          created_at: string
          ended_at: string | null
          id: string
          initiated_by: string
          mentee_accepted_at: string | null
          mentee_id: string
          mentor_accepted_at: string | null
          mentor_id: string
          state: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "v7_mentor_pairs"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      bible_v7_withdraw_curriculum_lesson: {
        Args: {
          p_congregation_id: string
          p_expected_lesson_revision_id: string
          p_expected_module_revision_id: string
          p_expected_track_revision_id: string
          p_lesson_id: string
          p_lesson_revision_id: string
          p_module_id: string
          p_track_id: string
        }
        Returns: {
          congregation_id: string
          lesson_id: string
          lesson_publication_state: string
          lesson_revision_id: string
          module_id: string
          module_publication_state: string
          published_at: string
          track_id: string
          track_publication_state: string
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
    Enums: {},
  },
} as const


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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          page_path: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          page_path?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          author_name: string | null
          category: string | null
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          images: Json | null
          is_published: boolean | null
          public_id: string | null
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
          views: number | null
          views_count: number | null
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          content: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          images?: Json | null
          is_published?: boolean | null
          public_id?: string | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
          views?: number | null
          views_count?: number | null
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          images?: Json | null
          is_published?: boolean | null
          public_id?: string | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          views?: number | null
          views_count?: number | null
        }
        Relationships: []
      }
      companies_showcase: {
        Row: {
          city: string | null
          company_name: string
          company_type: string | null
          created_at: string
          description: string | null
          id: string
          is_published: boolean | null
          logo: string | null
          region: string | null
          sector: string | null
          website: string | null
        }
        Insert: {
          city?: string | null
          company_name: string
          company_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          logo?: string | null
          region?: string | null
          sector?: string | null
          website?: string | null
        }
        Update: {
          city?: string | null
          company_name?: string
          company_type?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          logo?: string | null
          region?: string | null
          sector?: string | null
          website?: string | null
        }
        Relationships: []
      }
      company_associates: {
        Row: {
          company_request_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          marital_regime: string | null
          marital_status: string | null
          phone: string | null
          profession: string | null
          residence_address: string | null
        }
        Insert: {
          company_request_id: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          marital_regime?: string | null
          marital_status?: string | null
          phone?: string | null
          profession?: string | null
          residence_address?: string | null
        }
        Update: {
          company_request_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          marital_regime?: string | null
          marital_status?: string | null
          phone?: string | null
          profession?: string | null
          residence_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_associates_company_request_id_fkey"
            columns: ["company_request_id"]
            isOneToOne: false
            referencedRelation: "company_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      company_requests: {
        Row: {
          activity: string | null
          additional_services: string[] | null
          address: string | null
          assigned_to: string | null
          associates: Json | null
          bank: string | null
          bp: string | null
          capital: string | null
          city: string | null
          client_rating: number | null
          client_review: string | null
          company_name: string
          company_type: string
          contact_name: string | null
          created_at: string
          discount_applied: number | null
          documents: Json | null
          email: string | null
          estimated_price: number | null
          id: string
          manager_email: string | null
          manager_mandate_duration: string | null
          manager_marital_regime: string | null
          manager_marital_status: string | null
          manager_name: string | null
          manager_phone: string | null
          manager_residence: string | null
          notes: string | null
          payment_amount: number | null
          payment_reference: string | null
          payment_status: string | null
          phone: string | null
          referral_code: string | null
          referrer_code: string | null
          region: string | null
          sigle: string | null
          status: string
          structure_type: string | null
          tracking_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          activity?: string | null
          additional_services?: string[] | null
          address?: string | null
          assigned_to?: string | null
          associates?: Json | null
          bank?: string | null
          bp?: string | null
          capital?: string | null
          city?: string | null
          client_rating?: number | null
          client_review?: string | null
          company_name: string
          company_type?: string
          contact_name?: string | null
          created_at?: string
          discount_applied?: number | null
          documents?: Json | null
          email?: string | null
          estimated_price?: number | null
          id?: string
          manager_email?: string | null
          manager_mandate_duration?: string | null
          manager_marital_regime?: string | null
          manager_marital_status?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          manager_residence?: string | null
          notes?: string | null
          payment_amount?: number | null
          payment_reference?: string | null
          payment_status?: string | null
          phone?: string | null
          referral_code?: string | null
          referrer_code?: string | null
          region?: string | null
          sigle?: string | null
          status?: string
          structure_type?: string | null
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          activity?: string | null
          additional_services?: string[] | null
          address?: string | null
          assigned_to?: string | null
          associates?: Json | null
          bank?: string | null
          bp?: string | null
          capital?: string | null
          city?: string | null
          client_rating?: number | null
          client_review?: string | null
          company_name?: string
          company_type?: string
          contact_name?: string | null
          created_at?: string
          discount_applied?: number | null
          documents?: Json | null
          email?: string | null
          estimated_price?: number | null
          id?: string
          manager_email?: string | null
          manager_mandate_duration?: string | null
          manager_marital_regime?: string | null
          manager_marital_status?: string | null
          manager_name?: string | null
          manager_phone?: string | null
          manager_residence?: string | null
          notes?: string | null
          payment_amount?: number | null
          payment_reference?: string | null
          payment_status?: string | null
          phone?: string | null
          referral_code?: string | null
          referrer_code?: string | null
          region?: string | null
          sigle?: string | null
          status?: string
          structure_type?: string | null
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean | null
          message: string
          name: string
          phone: string | null
          replied: boolean | null
          subject: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          phone?: string | null
          replied?: boolean | null
          subject?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          phone?: string | null
          replied?: boolean | null
          subject?: string | null
        }
        Relationships: []
      }
      created_companies: {
        Row: {
          created_at: string
          district: string | null
          founder_name: string | null
          founder_photo_url: string | null
          id: string
          is_published: boolean | null
          logo_url: string | null
          name: string
          rating: number | null
          region: string | null
          testimonial: string | null
          type: string | null
        }
        Insert: {
          created_at?: string
          district?: string | null
          founder_name?: string | null
          founder_photo_url?: string | null
          id?: string
          is_published?: boolean | null
          logo_url?: string | null
          name: string
          rating?: number | null
          region?: string | null
          testimonial?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          district?: string | null
          founder_name?: string | null
          founder_photo_url?: string | null
          id?: string
          is_published?: boolean | null
          logo_url?: string | null
          name?: string
          rating?: number | null
          region?: string | null
          testimonial?: string | null
          type?: string | null
        }
        Relationships: []
      }
      dns_check_history: {
        Row: {
          all_ok: boolean
          checked_at: string
          details: Json | null
          dkim_ok: boolean
          dmarc_ok: boolean
          domain: string
          id: string
          spf_ok: boolean
        }
        Insert: {
          all_ok?: boolean
          checked_at?: string
          details?: Json | null
          dkim_ok?: boolean
          dmarc_ok?: boolean
          domain: string
          id?: string
          spf_ok?: boolean
        }
        Update: {
          all_ok?: boolean
          checked_at?: string
          details?: Json | null
          dkim_ok?: boolean
          dmarc_ok?: boolean
          domain?: string
          id?: string
          spf_ok?: boolean
        }
        Relationships: []
      }
      ebook_downloads: {
        Row: {
          created_at: string
          ebook_id: string
          id: string
          user_email: string
          user_name: string | null
        }
        Insert: {
          created_at?: string
          ebook_id: string
          id?: string
          user_email: string
          user_name?: string | null
        }
        Update: {
          created_at?: string
          ebook_id?: string
          id?: string
          user_email?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ebook_downloads_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      ebooks: {
        Row: {
          category: string | null
          cover_image: string | null
          created_at: string
          description: string | null
          download_count: number | null
          file_url: string | null
          id: string
          is_free: boolean | null
          is_published: boolean | null
          price: number | null
          slug: string
          title: string
        }
        Insert: {
          category?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          download_count?: number | null
          file_url?: string | null
          id?: string
          is_free?: boolean | null
          is_published?: boolean | null
          price?: number | null
          slug: string
          title: string
        }
        Update: {
          category?: string | null
          cover_image?: string | null
          created_at?: string
          description?: string | null
          download_count?: number | null
          file_url?: string | null
          id?: string
          is_free?: boolean | null
          is_published?: boolean | null
          price?: number | null
          slug?: string
          title?: string
        }
        Relationships: []
      }
      faq: {
        Row: {
          answer: string
          category: string | null
          created_at: string
          id: string
          is_published: boolean | null
          question: string
          sort_order: number | null
        }
        Insert: {
          answer: string
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          question: string
          sort_order?: number | null
        }
        Update: {
          answer?: string
          category?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          question?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      forum_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          is_ai_generated: boolean | null
          topic_id: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_ai_generated?: boolean | null
          topic_id: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_ai_generated?: boolean | null
          topic_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topics: {
        Row: {
          category: string | null
          content: string
          created_at: string
          id: string
          is_locked: boolean | null
          is_pinned: boolean | null
          title: string
          updated_at: string
          user_id: string | null
          views: number | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          title: string
          updated_at?: string
          user_id?: string | null
          views?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string | null
          views?: number | null
        }
        Relationships: []
      }
      identity_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string | null
          file_url: string
          id: string
          rejection_reason: string | null
          request_id: string | null
          status: string | null
          user_id: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_type?: string
          file_name?: string | null
          file_url: string
          id?: string
          rejection_reason?: string | null
          request_id?: string | null
          status?: string | null
          user_id: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string | null
          file_url?: string
          id?: string
          rejection_reason?: string | null
          request_id?: string | null
          status?: string | null
          user_id?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string
          items: Json | null
          paid_at: string | null
          payment_provider: string | null
          payment_transaction_id: string | null
          request_id: string | null
          request_type: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          items?: Json | null
          paid_at?: string | null
          payment_provider?: string | null
          payment_transaction_id?: string | null
          request_id?: string | null
          request_type?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          items?: Json | null
          paid_at?: string | null
          payment_provider?: string | null
          payment_transaction_id?: string | null
          request_id?: string | null
          request_type?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lexia_conversations: {
        Row: {
          created_at: string
          id: string
          session_id: string
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_id: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      lexia_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "lexia_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "lexia_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          author_name: string | null
          category: string | null
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean | null
          public_id: string | null
          published_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string | null
          category?: string | null
          content: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          public_id?: string | null
          published_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string | null
          category?: string | null
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          public_id?: string | null
          published_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_campaigns: {
        Row: {
          created_at: string
          created_by: string | null
          failure_count: number | null
          html_content: string
          id: string
          recipients_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          subject: string
          success_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          failure_count?: number | null
          html_content: string
          id?: string
          recipients_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          success_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          failure_count?: number | null
          html_content?: string
          id?: string
          recipients_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          success_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_send_logs: {
        Row: {
          attempt: number
          campaign_id: string
          created_at: string
          error_message: string | null
          id: string
          provider_message_id: string | null
          recipient_email: string
          status: string
        }
        Insert: {
          attempt?: number
          campaign_id: string
          created_at?: string
          error_message?: string | null
          id?: string
          provider_message_id?: string | null
          recipient_email: string
          status: string
        }
        Update: {
          attempt?: number
          campaign_id?: string
          created_at?: string
          error_message?: string | null
          id?: string
          provider_message_id?: string | null
          recipient_email?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_send_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "newsletter_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_active: boolean
          source: string | null
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          source?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          source?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      page_contents: {
        Row: {
          content: Json
          id: string
          page_key: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content?: Json
          id?: string
          page_key: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: Json
          id?: string
          page_key?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          metadata: Json | null
          provider: string | null
          request_id: string | null
          request_type: string | null
          status: string | null
          transaction_id: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          provider?: string | null
          request_id?: string | null
          request_type?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          provider?: string | null
          request_id?: string | null
          request_type?: string | null
          status?: string | null
          transaction_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          phone: string | null
          referral_balance: number | null
          referral_code: string | null
          referral_count: number | null
          referral_earnings: number | null
          referral_link: string | null
          referred_by: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          referral_balance?: number | null
          referral_code?: string | null
          referral_count?: number | null
          referral_earnings?: number | null
          referral_link?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          referral_balance?: number | null
          referral_code?: string | null
          referral_count?: number | null
          referral_earnings?: number | null
          referral_link?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      referral_withdrawals: {
        Row: {
          amount: number
          created_at: string
          id: string
          method: string | null
          payment_details: Json | null
          payment_method: string | null
          phone: string | null
          processed_at: string | null
          processed_by: string | null
          requested_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          method?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          phone?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          method?: string | null
          payment_details?: Json | null
          payment_method?: string | null
          phone?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      request_documents_exchange: {
        Row: {
          created_at: string
          direction: string | null
          document_name: string | null
          document_type: string | null
          document_url: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          message: string | null
          notes: string | null
          request_id: string
          request_type: string
          sender_id: string | null
          sender_role: string | null
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          direction?: string | null
          document_name?: string | null
          document_type?: string | null
          document_url?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          message?: string | null
          notes?: string | null
          request_id: string
          request_type?: string
          sender_id?: string | null
          sender_role?: string | null
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          direction?: string | null
          document_name?: string | null
          document_type?: string | null
          document_url?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          message?: string | null
          notes?: string | null
          request_id?: string
          request_type?: string
          sender_id?: string | null
          sender_role?: string | null
          uploaded_by?: string | null
        }
        Relationships: []
      }
      request_messages: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          request_id: string
          request_type: string
          sender_id: string | null
          sender_role: string | null
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          request_id: string
          request_type?: string
          sender_id?: string | null
          sender_role?: string | null
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          request_id?: string
          request_type?: string
          sender_id?: string | null
          sender_role?: string | null
        }
        Relationships: []
      }
      search_results_cache: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          query: string
          results: Json
          sources: Json | null
        }
        Insert: {
          created_at?: string
          expires_at?: string
          id?: string
          query: string
          results?: Json
          sources?: Json | null
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          query?: string
          results?: Json
          sources?: Json | null
        }
        Relationships: []
      }
      service_requests: {
        Row: {
          assigned_to: string | null
          client_rating: number | null
          client_review: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          details: Json | null
          estimated_price: number | null
          id: string
          notes: string | null
          payment_amount: number | null
          payment_reference: string | null
          payment_status: string | null
          service_category: string | null
          service_type: string
          status: string
          tracking_number: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          client_rating?: number | null
          client_review?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          details?: Json | null
          estimated_price?: number | null
          id?: string
          notes?: string | null
          payment_amount?: number | null
          payment_reference?: string | null
          payment_status?: string | null
          service_category?: string | null
          service_type: string
          status?: string
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          client_rating?: number | null
          client_review?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          details?: Json | null
          estimated_price?: number | null
          id?: string
          notes?: string | null
          payment_amount?: number | null
          payment_reference?: string | null
          payment_status?: string | null
          service_category?: string | null
          service_type?: string
          status?: string
          tracking_number?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          message: string
          priority: string | null
          status: string | null
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          message: string
          priority?: string | null
          status?: string | null
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          message?: string
          priority?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          permissions: Json | null
          phone: string | null
          role: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          phone?: string | null
          role?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          phone?: string | null
          role?: string | null
          user_id?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          avatar_url: string | null
          comment: string
          company: string | null
          company_type: string | null
          created_at: string
          id: string
          is_approved: boolean | null
          location: string | null
          logo: string | null
          message: string | null
          name: string
          rating: number
          region: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          comment: string
          company?: string | null
          company_type?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          location?: string | null
          logo?: string | null
          message?: string | null
          name: string
          rating?: number
          region?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          comment?: string
          company?: string | null
          company_type?: string | null
          created_at?: string
          id?: string
          is_approved?: boolean | null
          location?: string | null
          logo?: string | null
          message?: string | null
          name?: string
          rating?: number
          region?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      forum_comments: {
        Row: {
          content: string | null
          created_at: string | null
          id: string | null
          likes_count: number | null
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          id?: string | null
          likes_count?: never
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          id?: string | null
          likes_count?: never
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_replies_topic_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_replies_topic_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          id: string | null
          is_pinned: boolean | null
          likes_count: number | null
          title: string | null
          updated_at: string | null
          user_id: string | null
          views_count: number | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          is_pinned?: boolean | null
          likes_count?: never
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          views_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string | null
          is_pinned?: boolean | null
          likes_count?: never
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_blog_views: { Args: { post_id: string }; Returns: undefined }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      reset_stuck_newsletter_campaigns: { Args: never; Returns: Json }
      unsubscribe_newsletter: { Args: { _email: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "team" | "client"
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
      app_role: ["admin", "team", "client"],
    },
  },
} as const

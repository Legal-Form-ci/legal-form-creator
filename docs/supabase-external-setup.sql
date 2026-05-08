-- ============================================================
-- SCRIPT DE CONFIGURATION SUPABASE EXTERNE POUR LEGAL FORM
-- À exécuter dans l'éditeur SQL de votre projet Supabase externe
-- ============================================================

-- ============================================================
-- PARTIE 1: TABLES PRINCIPALES
-- ============================================================

-- Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des rôles utilisateurs
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des demandes de création d'entreprise
CREATE TABLE IF NOT EXISTS public.company_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  company_name TEXT NOT NULL,
  sigle TEXT,
  structure_type TEXT NOT NULL,
  capital TEXT,
  activity TEXT,
  bank TEXT,
  region TEXT,
  city TEXT,
  address TEXT,
  bp TEXT,
  contact_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  manager_residence TEXT,
  manager_marital_status TEXT,
  manager_marital_regime TEXT,
  manager_mandate_duration TEXT,
  additional_services TEXT[],
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT,
  payment_id TEXT,
  estimated_price NUMERIC,
  tracking_number TEXT UNIQUE,
  assigned_to UUID,
  client_rating INTEGER,
  client_review TEXT,
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des associés
CREATE TABLE IF NOT EXISTS public.company_associates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_request_id UUID NOT NULL REFERENCES public.company_requests(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  profession TEXT,
  residence_address TEXT,
  marital_status TEXT,
  marital_regime TEXT,
  shares_count INTEGER,
  shares_percentage NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des demandes de services
CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  service_type TEXT NOT NULL,
  service_category TEXT,
  company_name TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  description TEXT,
  service_details JSONB,
  documents JSONB,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT,
  payment_id TEXT,
  estimated_price NUMERIC,
  tracking_number TEXT UNIQUE,
  assigned_to UUID,
  client_rating INTEGER,
  client_review TEXT,
  closed_at TIMESTAMP WITH TIME ZONE,
  closed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des paiements
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  request_id TEXT,
  request_type TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT,
  transaction_id TEXT,
  tracking_number TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des logs de paiement
CREATE TABLE IF NOT EXISTS public.payment_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES public.payments(id),
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des messages de contact
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  replied_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des tickets support
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'open',
  assigned_to UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des entreprises créées (témoignages)
CREATE TABLE IF NOT EXISTS public.created_companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  region TEXT NOT NULL,
  district TEXT,
  founder_name TEXT,
  founder_photo_url TEXT,
  logo_url TEXT,
  testimonial TEXT,
  rating INTEGER,
  is_visible BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des documents d'identité
CREATE TABLE IF NOT EXISTS public.identity_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  request_id TEXT NOT NULL,
  request_type TEXT NOT NULL,
  document_type TEXT NOT NULL,
  front_url TEXT NOT NULL,
  back_url TEXT,
  face_detected BOOLEAN,
  verified BOOLEAN DEFAULT false,
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des messages de demande
CREATE TABLE IF NOT EXISTS public.request_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id TEXT NOT NULL,
  request_type TEXT NOT NULL,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des documents échangés
CREATE TABLE IF NOT EXISTS public.request_documents_exchange (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id TEXT NOT NULL,
  request_type TEXT NOT NULL,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL,
  document_name TEXT NOT NULL,
  document_url TEXT NOT NULL,
  document_type TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des conversations LexIA
CREATE TABLE IF NOT EXISTS public.lexia_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id UUID,
  visitor_name TEXT,
  visitor_email TEXT,
  summary TEXT,
  satisfaction_rating INTEGER,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des messages LexIA
CREATE TABLE IF NOT EXISTS public.lexia_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.lexia_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des articles de blog
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image TEXT,
  author_id UUID,
  author_name TEXT,
  category TEXT,
  tags TEXT[],
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMP WITH TIME ZONE,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des ebooks
CREATE TABLE IF NOT EXISTS public.ebooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  cover_image TEXT,
  category TEXT,
  price NUMERIC,
  is_free BOOLEAN DEFAULT true,
  is_published BOOLEAN DEFAULT false,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table des téléchargements ebook
CREATE TABLE IF NOT EXISTS public.ebook_downloads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ebook_id UUID NOT NULL REFERENCES public.ebooks(id),
  user_email TEXT NOT NULL,
  user_name TEXT,
  downloaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ============================================================
-- PARTIE 2: FONCTIONS UTILITAIRES
-- ============================================================

-- Fonction pour vérifier si un utilisateur est admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'super_admin')
  );
$$;

-- Fonction pour vérifier si un utilisateur est membre de l'équipe
CREATE OR REPLACE FUNCTION public.is_team_member(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role IN ('admin', 'super_admin', 'team')
  );
$$;

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer un numéro de suivi
CREATE OR REPLACE FUNCTION public.generate_tracking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.tracking_number IS NULL THEN
    NEW.tracking_number := 'LF-' || 
      CASE 
        WHEN TG_TABLE_NAME = 'company_requests' THEN 'ENT'
        WHEN TG_TABLE_NAME = 'service_requests' THEN 'SRV'
        ELSE 'REQ'
      END || '-' || 
      to_char(NOW(), 'YYYYMMDD') || '-' || 
      upper(substring(md5(random()::text) from 1 for 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- PARTIE 3: TRIGGERS
-- ============================================================

-- Triggers pour updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_roles_updated_at BEFORE UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_company_requests_updated_at BEFORE UPDATE ON public.company_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_requests_updated_at BEFORE UPDATE ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON public.blog_posts
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers pour numéros de suivi
CREATE TRIGGER generate_company_tracking_number BEFORE INSERT ON public.company_requests
FOR EACH ROW EXECUTE FUNCTION public.generate_tracking_number();

CREATE TRIGGER generate_service_tracking_number BEFORE INSERT ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.generate_tracking_number();

CREATE TRIGGER generate_payment_tracking_number BEFORE INSERT ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.generate_tracking_number();

-- ============================================================
-- PARTIE 4: ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Activer RLS sur toutes les tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_associates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.created_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_documents_exchange ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lexia_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lexia_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ebook_downloads ENABLE ROW LEVEL SECURITY;

-- Politiques pour profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin(auth.uid()));

-- Politiques pour user_roles
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.is_admin(auth.uid()));

-- Politiques pour company_requests
CREATE POLICY "Users can view own company requests" ON public.company_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create company requests" ON public.company_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can view all company requests" ON public.company_requests FOR SELECT USING (public.is_team_member(auth.uid()));
CREATE POLICY "Team can update company requests" ON public.company_requests FOR UPDATE USING (public.is_team_member(auth.uid()));

-- Politiques pour company_associates
CREATE POLICY "Users can manage own associates" ON public.company_associates FOR ALL 
USING (EXISTS (SELECT 1 FROM public.company_requests WHERE id = company_request_id AND user_id = auth.uid()));
CREATE POLICY "Team can manage all associates" ON public.company_associates FOR ALL USING (public.is_team_member(auth.uid()));

-- Politiques pour service_requests
CREATE POLICY "Users can view own service requests" ON public.service_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create service requests" ON public.service_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Team can view all service requests" ON public.service_requests FOR SELECT USING (public.is_team_member(auth.uid()));
CREATE POLICY "Team can update service requests" ON public.service_requests FOR UPDATE USING (public.is_team_member(auth.uid()));

-- Politiques pour payments
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Team can manage all payments" ON public.payments FOR ALL USING (public.is_team_member(auth.uid()));

-- Politiques pour payment_logs
CREATE POLICY "Team can view payment logs" ON public.payment_logs FOR SELECT USING (public.is_team_member(auth.uid()));

-- Politiques pour contact_messages
CREATE POLICY "Anyone can insert contact messages" ON public.contact_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Team can view contact messages" ON public.contact_messages FOR SELECT USING (public.is_team_member(auth.uid()));
CREATE POLICY "Team can update contact messages" ON public.contact_messages FOR UPDATE USING (public.is_team_member(auth.uid()));

-- Politiques pour support_tickets
CREATE POLICY "Users can manage own tickets" ON public.support_tickets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Team can manage all tickets" ON public.support_tickets FOR ALL USING (public.is_team_member(auth.uid()));

-- Politiques pour created_companies
CREATE POLICY "Public can view visible companies" ON public.created_companies FOR SELECT USING (is_visible = true);
CREATE POLICY "Team can manage all companies" ON public.created_companies FOR ALL USING (public.is_team_member(auth.uid()));
CREATE POLICY "Anyone can insert testimonials" ON public.created_companies FOR INSERT WITH CHECK (true);

-- Politiques pour identity_documents
CREATE POLICY "Users can manage own documents" ON public.identity_documents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Team can manage all documents" ON public.identity_documents FOR ALL USING (public.is_team_member(auth.uid()));

-- Politiques pour request_messages
CREATE POLICY "Users can view own messages" ON public.request_messages FOR SELECT USING (auth.uid() = sender_id);
CREATE POLICY "Team can manage all messages" ON public.request_messages FOR ALL USING (public.is_team_member(auth.uid()));
CREATE POLICY "Users can send messages" ON public.request_messages FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Politiques pour request_documents_exchange
CREATE POLICY "Users can manage own documents" ON public.request_documents_exchange FOR ALL USING (auth.uid() = sender_id);
CREATE POLICY "Team can manage all documents" ON public.request_documents_exchange FOR ALL USING (public.is_team_member(auth.uid()));

-- Politiques pour lexia_conversations
CREATE POLICY "Anyone can create conversations" ON public.lexia_conversations FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can view own conversations" ON public.lexia_conversations FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY "Team can view all conversations" ON public.lexia_conversations FOR SELECT USING (public.is_team_member(auth.uid()));

-- Politiques pour lexia_messages
CREATE POLICY "Anyone can insert messages" ON public.lexia_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can view messages" ON public.lexia_messages FOR SELECT USING (true);

-- Politiques pour blog_posts
CREATE POLICY "Public can view published posts" ON public.blog_posts FOR SELECT USING (is_published = true);
CREATE POLICY "Team can manage all posts" ON public.blog_posts FOR ALL USING (public.is_team_member(auth.uid()));

-- Politiques pour ebooks
CREATE POLICY "Public can view published ebooks" ON public.ebooks FOR SELECT USING (is_published = true);
CREATE POLICY "Team can manage all ebooks" ON public.ebooks FOR ALL USING (public.is_team_member(auth.uid()));

-- Politiques pour ebook_downloads
CREATE POLICY "Anyone can download ebooks" ON public.ebook_downloads FOR INSERT WITH CHECK (true);
CREATE POLICY "Team can view downloads" ON public.ebook_downloads FOR SELECT USING (public.is_team_member(auth.uid()));

-- ============================================================
-- PARTIE 5: INDEX POUR PERFORMANCES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_company_requests_user_id ON public.company_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_company_requests_status ON public.company_requests(status);
CREATE INDEX IF NOT EXISTS idx_company_requests_tracking_number ON public.company_requests(tracking_number);
CREATE INDEX IF NOT EXISTS idx_company_requests_phone ON public.company_requests(phone);
CREATE INDEX IF NOT EXISTS idx_service_requests_user_id ON public.service_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON public.service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_tracking_number ON public.service_requests(tracking_number);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_tracking_number ON public.payments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_created_companies_is_visible ON public.created_companies(is_visible);
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON public.blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_is_published ON public.blog_posts(is_published);

-- ============================================================
-- PARTIE 6: REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.company_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.request_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contact_messages;

-- ============================================================
-- PARTIE 7: STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('company-logos', 'company-logos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('testimonial-photos', 'testimonial-photos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('identity-documents', 'identity-documents', false) ON CONFLICT DO NOTHING;

-- Politiques de stockage
CREATE POLICY "Anyone can view public avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload own avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Anyone can view company logos" ON storage.objects FOR SELECT USING (bucket_id = 'company-logos');
CREATE POLICY "Anyone can upload logos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'company-logos');
CREATE POLICY "Anyone can view testimonial photos" ON storage.objects FOR SELECT USING (bucket_id = 'testimonial-photos');
CREATE POLICY "Anyone can upload testimonial photos" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'testimonial-photos');

-- ============================================================
-- FIN DU SCRIPT
-- ============================================================
-- Après exécution de ce script :
-- 1. Configurez les clés API dans votre projet Supabase
-- 2. Mettez à jour les variables d'environnement dans votre projet
-- 3. Créez le premier super admin via la page /admin/setup
-- ============================================================

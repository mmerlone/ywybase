-- Initial schema migration for YwyBase application
-- Created: 2026-01-05
-- Description: Creates profiles table with functions, triggers, and RLS policies

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Handle new user creation (auto-create profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_display_name text;
BEGIN
  -- Get display_name from metadata 'name' field, falling back to email prefix if empty
  v_display_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    SPLIT_PART(NEW.email, '@', 1) -- Fallback to email prefix
  );

  INSERT INTO public.profiles (
    id, 
    email,
    first_name,
    last_name,
    display_name,
    avatar_url, 
    theme,
    email_verified
  ) VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    v_display_name,
    NEW.raw_user_meta_data->>'avatar_url', 
    'light',
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    email_verified = EXCLUDED.email_verified,
    updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function: Check if user owns an avatar
CREATE OR REPLACE FUNCTION public.is_avatar_owner(user_id text, object_name text)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT auth.uid()::text = user_id AND 
           (storage.foldername(object_name))[1] = user_id
  );
END;
$$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL PRIMARY KEY,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    email text NOT NULL,
    email_verified boolean DEFAULT false,
    phone text,
    phone_verified boolean DEFAULT false,
    first_name text,
    last_name text,
    display_name text NOT NULL,
    gender text,
    birth_date date,
    timezone text,
    locale text,
    country_code character(2),
    city text,
    state text,
    theme text DEFAULT 'system'::text NOT NULL,
    notification_preferences jsonb DEFAULT '{"sms": false, "push": true, "email": true}'::jsonb,
    privacy_settings jsonb DEFAULT '{"email_visibility": "private", "profile_visibility": "public"}'::jsonb,
    bio text,
    company text,
    job_title text,
    website text,
    social_links jsonb DEFAULT '{}'::jsonb,
    avatar_url text,
    last_active_at timestamp with time zone,
    is_onboarded boolean DEFAULT false,
    
    -- Constraints
    CONSTRAINT display_name_not_empty CHECK (display_name <> ''::text),
    CONSTRAINT email_format CHECK (
      (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text) AND 
      (email <> ''::text)
    ),
    CONSTRAINT profiles_gender_check CHECK (
      (gender IS NULL) OR 
      (gender = ANY (ARRAY['male'::text, 'female'::text, 'non-binary'::text, 'other'::text, 'prefer-not-to-say'::text]))
    ),
    CONSTRAINT profiles_theme_check CHECK (
      (theme IS NULL) OR 
      (theme = ANY (ARRAY['light'::text, 'dark'::text, 'system'::text]))
    ),
    
    -- Foreign key to auth.users
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Comments
COMMENT ON TABLE public.profiles IS 'User profiles with extended information beyond auth.users';
COMMENT ON COLUMN public.profiles.state IS 'State/Province/Region of the user';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles USING btree (email);
CREATE INDEX IF NOT EXISTS idx_profiles_state ON public.profiles USING btree (state);
CREATE INDEX IF NOT EXISTS idx_profiles_country_code ON public.profiles USING btree (country_code);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Auto-create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Auto-update updated_at timestamp
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Public profiles are viewable by everyone
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone."
  ON public.profiles
  FOR SELECT
  USING (true);

-- Policy: Users can insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile."
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile."
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================================
-- STORAGE BUCKET & POLICIES (Avatars)
-- ============================================================================

-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Anyone can upload an avatar
DROP POLICY IF EXISTS "Anyone can upload an avatar" ON storage.objects;
CREATE POLICY "Anyone can upload an avatar"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'avatars');

-- Storage Policy: Avatar images are publicly accessible
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'avatars');

-- Storage Policy: Users can update their own avatar
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects
  FOR UPDATE
  USING (auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'avatars');

-- Storage Policy: Users can delete their own avatar
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects
  FOR DELETE
  USING (public.is_avatar_owner(auth.uid()::text, name));

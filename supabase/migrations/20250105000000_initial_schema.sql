-- Initial schema migration for YwyBase application
-- Created: 2026-01-05
-- Updated: 2026-03-03 (audited against Supabase project jbhkkxnssbivgznxdjyt)
-- Description: Creates profiles table with functions, triggers, and RLS policies
-- Profiles.* is canonical; auth.users fields are synced via triggers where needed

-- ============================================================================
-- TYPES
-- ==========================================================================

DO $$
BEGIN
  CREATE TYPE public.user_role AS ENUM ('user', 'moderator', 'admin', 'root');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

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
  v_signup_method text;
  v_providers text[];
BEGIN
  -- Get display_name from metadata 'name' field, falling back to email prefix if empty
  v_display_name := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''),
    SPLIT_PART(NEW.email, '@', 1) -- Fallback to email prefix
  );

  -- Extract signup method from metadata
  v_signup_method := NEW.raw_user_meta_data->>'signup_method';

  -- Get OAuth providers from identities
  SELECT ARRAY_AGG(DISTINCT provider ORDER BY provider)
  INTO v_providers
  FROM auth.identities
  WHERE user_id = NEW.id;

  -- Add email provider if signup method indicates email
  IF v_signup_method = 'email' THEN
    v_providers := array_append(v_providers, 'email');
  END IF;

  -- Remove duplicates and sort
  v_providers := ARRAY(
    SELECT DISTINCT unnest
    FROM unnest(v_providers) as unnest
    ORDER BY unnest
  );

  INSERT INTO public.profiles (
    id, 
    email,
    phone,
    first_name,
    last_name,
    display_name,
    avatar_url, 
    theme,
    created_at,
    confirmed_at,
    last_sign_in_at,
    banned_until,
    providers,
    status,
    role
  ) VALUES (
    NEW.id, 
    NEW.email,
    NEW.phone,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    v_display_name,
    NEW.raw_user_meta_data->>'avatar_url', 
    'system',
    NEW.created_at,
    NEW.confirmed_at,
    NEW.last_sign_in_at,
    NEW.banned_until,
    COALESCE(v_providers, ARRAY[]::text[]),
    'active',
    'user'::public.user_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    display_name = EXCLUDED.display_name,
    avatar_url = EXCLUDED.avatar_url,
    created_at = EXCLUDED.created_at,
    confirmed_at = EXCLUDED.confirmed_at,
    last_sign_in_at = EXCLUDED.last_sign_in_at,
    banned_until = EXCLUDED.banned_until,
    providers = EXCLUDED.providers,
    updated_at = NOW();

  UPDATE auth.users
  SET raw_app_meta_data = jsonb_set(
        jsonb_set(COALESCE(raw_app_meta_data, '{}'::jsonb), '{role}', to_jsonb('user'::text)),
        '{role_updated_at}', to_jsonb(NOW())
      ),
      updated_at = NOW()
  WHERE id = NEW.id;
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

-- Function: Sync auth.users metadata to profiles (manual/admin use only)
CREATE OR REPLACE FUNCTION public.sync_auth_to_profiles()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Update profiles with latest auth.users data (excluding role, which is canonical in profiles)
  UPDATE public.profiles p
  SET
    created_at = u.created_at,
    confirmed_at = u.confirmed_at,
    last_sign_in_at = u.last_sign_in_at,
    banned_until = u.banned_until,
    avatar_url = COALESCE(u.raw_user_meta_data->>'avatar_url', p.avatar_url),
    providers = (
      SELECT ARRAY_AGG(DISTINCT provider ORDER BY provider)
      FROM auth.identities i
      WHERE i.user_id = u.id
    ),
    updated_at = NOW()
  FROM auth.users u
  WHERE p.id = u.id
    AND (
      p.created_at IS DISTINCT FROM u.created_at OR
      p.confirmed_at IS DISTINCT FROM u.confirmed_at OR
      p.last_sign_in_at IS DISTINCT FROM u.last_sign_in_at OR
      p.banned_until IS DISTINCT FROM u.banned_until OR
      p.avatar_url IS DISTINCT FROM COALESCE(u.raw_user_meta_data->>'avatar_url', p.avatar_url)
    );
END;
$$;

-- Function: Sync profiles to auth.users metadata (trigger-based)
CREATE OR REPLACE FUNCTION public.sync_profiles_to_auth()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Update auth.users with latest profile data (excluding role, which is handled by trigger)
  UPDATE auth.users u
  SET
    phone = p.phone,
    raw_user_meta_data = jsonb_set(
      jsonb_set(
        COALESCE(u.raw_user_meta_data, '{}'::jsonb),
        '{full_name}',
        to_jsonb(p.display_name)
      ),
      '{name}',
      to_jsonb(p.display_name)
    ),
    updated_at = NOW()
  FROM public.profiles p
  WHERE u.id = p.id
    AND (
      u.phone IS DISTINCT FROM p.phone OR
      u.raw_user_meta_data->>'full_name' IS DISTINCT FROM p.display_name OR
      u.raw_user_meta_data->>'name' IS DISTINCT FROM p.display_name
    );
END;
$$;

-- Function: Sync profile role to auth.users metadata
CREATE OR REPLACE FUNCTION public.sync_profile_role_to_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.role IS DISTINCT FROM OLD.role THEN
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
          jsonb_set(COALESCE(raw_app_meta_data, '{}'::jsonb), '{role}', to_jsonb(NEW.role::text)),
          '{role_updated_at}', to_jsonb(NOW())
        ),
        updated_at = NOW()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- Function: Secure role update (only admins/roots can change roles)
CREATE OR REPLACE FUNCTION public.update_user_role(
  target_user_id uuid,
  new_role public.user_role
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Check if current user is admin or root
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'root')
  ) THEN
    RAISE EXCEPTION 'Only admins or roots can change user roles';
  END IF;

  -- Update the role
  UPDATE public.profiles
  SET role = new_role, updated_at = NOW()
  WHERE id = target_user_id;

  RETURN FOUND;
END;
$$;

-- ============================================================================
-- TABLES
-- ============================================================================

-- Table: profiles
CREATE TABLE IF NOT EXISTS public.profiles (
    -- Core identity
    id uuid NOT NULL PRIMARY KEY,
    email text NOT NULL,
    phone text,
    
    -- Personal information
    first_name text,
    last_name text,
    display_name text NOT NULL,
    gender text,
    birth_date date,
    
    -- Location
    timezone text,
    locale text,
    country_code character(2),
    city text,
    state text,
    
    -- Profile content
    bio text,
    company text,
    job_title text,
    website text,
    avatar_url text,
    
    -- Preferences (JSONB)
    theme text DEFAULT 'system'::text NOT NULL,
    notification_preferences jsonb DEFAULT '{"sms": false, "push": true, "email": true}'::jsonb,
    privacy_settings jsonb DEFAULT '{"email_visibility": "private", "profile_visibility": "public"}'::jsonb,
    social_links jsonb DEFAULT '[]'::jsonb,
    
    -- Status and role
    status text DEFAULT 'active'::text NOT NULL,
    role public.user_role DEFAULT 'user'::public.user_role NOT NULL,
    is_onboarded boolean DEFAULT false,
    
    -- Synced fields from auth.users (read-only for users, updated via background jobs)
    created_at timestamp with time zone,
    confirmed_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    banned_until timestamp with time zone,
    providers text[] DEFAULT ARRAY[]::text[],
    
    -- Timestamps
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
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
    CONSTRAINT profiles_status_check CHECK (
      status = ANY (ARRAY['active'::text, 'inactive'::text, 'suspended'::text, 'pending'::text])
    ),
    
    -- Foreign key to auth.users
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Comments
COMMENT ON TABLE public.profiles IS 'User profiles with extended information and synced auth metadata. profiles.* is canonical and synced to auth.users where needed.';
COMMENT ON COLUMN public.profiles.state IS 'State/Province/Region of the user';
COMMENT ON COLUMN public.profiles.created_at IS 'Synced from auth.users.created_at';
COMMENT ON COLUMN public.profiles.confirmed_at IS 'Synced from auth.users.confirmed_at (email verification)';
COMMENT ON COLUMN public.profiles.last_sign_in_at IS 'Synced from auth.users.last_sign_in_at';
COMMENT ON COLUMN public.profiles.banned_until IS 'Synced from auth.users.banned_until';
COMMENT ON COLUMN public.profiles.providers IS 'Synced from auth.identities (e.g., [email, google, github])';
COMMENT ON COLUMN public.profiles.avatar_url IS 'Avatar URL - synced from auth.users.raw_user_meta_data.avatar_url on signup, user-managed after';

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles USING btree (email);
CREATE INDEX IF NOT EXISTS idx_profiles_state ON public.profiles USING btree (state);
CREATE INDEX IF NOT EXISTS idx_profiles_country_code ON public.profiles USING btree (country_code);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles USING btree (status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles USING btree (role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_last_sign_in_at ON public.profiles USING btree (last_sign_in_at);
CREATE INDEX IF NOT EXISTS idx_profiles_providers ON public.profiles USING gin (providers);

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

-- Trigger: Sync profiles.role to auth.users app_metadata.role
DROP TRIGGER IF EXISTS sync_profile_role_to_auth ON public.profiles;
CREATE TRIGGER sync_profile_role_to_auth
  AFTER INSERT OR UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_role_to_auth();

-- ============================================================================
-- TRIGGER: Sync auth.users updates to profiles (email confirmation, sign-in, ban)
-- ============================================================================

-- Function: Sync auth.users changes to profiles
CREATE OR REPLACE FUNCTION public.sync_auth_user_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Only sync if the relevant fields have changed
  IF NEW.confirmed_at IS DISTINCT FROM OLD.confirmed_at
     OR NEW.last_sign_in_at IS DISTINCT FROM OLD.last_sign_in_at
     OR NEW.banned_until IS DISTINCT FROM OLD.banned_until
  THEN
    UPDATE public.profiles
    SET
      confirmed_at = NEW.confirmed_at,
      last_sign_in_at = NEW.last_sign_in_at,
      banned_until = NEW.banned_until,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;

  -- Sync providers field when auth user metadata or password changes
  IF NEW.raw_app_meta_data IS DISTINCT FROM OLD.raw_app_meta_data
     OR NEW.encrypted_password IS DISTINCT FROM OLD.encrypted_password THEN
    -- Get current providers from identities and email if applicable
    DECLARE
      v_providers text[];
      v_has_email_identity boolean;
    BEGIN
      -- Get OAuth providers from identities
      SELECT ARRAY_AGG(DISTINCT provider ORDER BY provider)
      INTO v_providers
      FROM auth.identities
      WHERE user_id = NEW.id;

      -- Check if user has email provider (from original signup)
      SELECT EXISTS(
        SELECT 1 FROM auth.identities 
        WHERE user_id = NEW.id AND provider = 'email'
      ) INTO v_has_email_identity;

      -- Add email provider if present in auth metadata, identities, or if password exists
      IF v_has_email_identity 
         OR NEW.raw_app_meta_data->>'provider' = 'email' 
         OR NEW.encrypted_password IS NOT NULL THEN
        v_providers := array_append(v_providers, 'email');
      END IF;

      -- Remove duplicates and sort
      v_providers := ARRAY(
        SELECT DISTINCT unnest
        FROM unnest(v_providers) as unnest
        ORDER BY unnest
      );

      -- Update profiles with new providers array
      UPDATE public.profiles
      SET
        providers = COALESCE(v_providers, ARRAY[]::text[]),
        updated_at = NOW()
      WHERE id = NEW.id;
    END;
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger: Auto-sync auth.users updates to profiles
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;

CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_auth_user_updates();

-- ============================================================================
-- TRIGGER: Sync auth.identities updates to profiles
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_identities_to_profiles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  v_user_id uuid;
  v_providers text[];
  v_has_password boolean;
BEGIN
  v_user_id := COALESCE(NEW.user_id, OLD.user_id);

  -- Get OAuth providers from identities
  SELECT ARRAY_AGG(DISTINCT provider ORDER BY provider)
  INTO v_providers
  FROM auth.identities
  WHERE user_id = v_user_id;

  -- Check if user has a password set
  SELECT encrypted_password IS NOT NULL INTO v_has_password
  FROM auth.users
  WHERE id = v_user_id;

  IF v_has_password THEN
    v_providers := array_append(v_providers, 'email');
  END IF;

  -- Remove duplicates and sort
  v_providers := ARRAY(
    SELECT DISTINCT unnest
    FROM unnest(v_providers) as unnest
    ORDER BY unnest
  );

  UPDATE public.profiles
  SET
    providers = COALESCE(v_providers, ARRAY[]::text[]),
    updated_at = NOW()
  WHERE id = v_user_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_auth_identity_changed ON auth.identities;

CREATE TRIGGER on_auth_identity_changed
  AFTER INSERT OR DELETE ON auth.identities
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_identities_to_profiles();

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
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- STORAGE BUCKET & POLICIES (Avatars)
-- ============================================================================

-- Create avatars bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Authenticated users can upload avatars to their own folder
DROP POLICY IF EXISTS "Authenticated users can upload avatars to their own folder" ON storage.objects;
CREATE POLICY "Authenticated users can upload avatars to their own folder"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

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
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid() IS NOT NULL AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage Policy: Users can delete their own avatar
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects
  FOR DELETE
  USING (public.is_avatar_owner(auth.uid()::text, name));

-- ============================================================================
-- SYNC REPORT FUNCTIONS
-- ============================================================================

-- Function: Report profile-auth sync state
CREATE OR REPLACE FUNCTION public.report_profile_auth_sync()
RETURNS TABLE (
    user_id uuid,
    email text,
    sync_status text,
    out_of_sync_fields jsonb,
    profiles_updated_at timestamp with time zone,
    auth_users_updated_at timestamp with time zone,
    details jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    RETURN QUERY
    WITH profile_auth_comparison AS (
        SELECT 
            p.id as user_id,
            p.email,
            p.updated_at as profiles_updated_at,
            u.updated_at as auth_users_updated_at,
            -- Check auth.users -> profiles sync fields
            CASE 
                WHEN p.created_at IS DISTINCT FROM u.created_at THEN 'created_at'
                ELSE NULL
            END as created_at_mismatch,
            CASE 
                WHEN p.confirmed_at IS DISTINCT FROM u.confirmed_at THEN 'confirmed_at'
                ELSE NULL
            END as confirmed_at_mismatch,
            CASE 
                WHEN p.last_sign_in_at IS DISTINCT FROM u.last_sign_in_at THEN 'last_sign_in_at'
                ELSE NULL
            END as last_sign_in_at_mismatch,
            CASE 
                WHEN p.banned_until IS DISTINCT FROM u.banned_until THEN 'banned_until'
                ELSE NULL
            END as banned_until_mismatch,
            CASE 
                WHEN p.avatar_url IS DISTINCT FROM COALESCE(u.raw_user_meta_data->>'avatar_url', p.avatar_url) THEN 'avatar_url'
                ELSE NULL
            END as avatar_url_mismatch,
            -- Check profiles -> auth.users sync fields
            CASE 
                WHEN u.phone IS DISTINCT FROM p.phone THEN 'phone'
                ELSE NULL
            END as phone_mismatch,
            CASE 
                WHEN u.raw_user_meta_data->>'full_name' IS DISTINCT FROM p.display_name THEN 'display_name_full_name'
                ELSE NULL
            END as display_name_full_name_mismatch,
            CASE 
                WHEN u.raw_user_meta_data->>'name' IS DISTINCT FROM p.display_name THEN 'display_name_name'
                ELSE NULL
            END as display_name_name_mismatch,
            -- Check role sync
            CASE 
                WHEN u.raw_app_meta_data->>'role' IS DISTINCT FROM p.role::text THEN 'role'
                ELSE NULL
            END as role_mismatch,
            -- Check providers sync
            CASE 
                WHEN p.providers IS DISTINCT FROM (
                    SELECT ARRAY_AGG(DISTINCT provider ORDER BY provider)
                    FROM auth.identities i
                    WHERE i.user_id = u.id
                ) THEN 'providers'
                ELSE NULL
            END as providers_mismatch
        FROM public.profiles p
        INNER JOIN auth.users u ON p.id = u.id
    ),
    sync_analysis AS (
        -- Build per-user detail objects and collect non-null ones into a jsonb array.
        -- Identities are resolved via subquery to avoid fan-out from a direct JOIN.
        SELECT 
            pac.user_id,
            pac.email,
            pac.profiles_updated_at,
            pac.auth_users_updated_at,
            mismatch_details.jsonb_agg
        FROM profile_auth_comparison pac
        INNER JOIN public.profiles p ON pac.user_id = p.id
        INNER JOIN auth.users u ON pac.user_id = u.id
        CROSS JOIN LATERAL (
            -- Use VALUES to build the candidate detail rows, then filter nulls and aggregate.
            -- This avoids ARRAY[...]::jsonb[] which requires a native array, not a jsonb value.
            SELECT jsonb_agg(detail)
            FROM (
                VALUES
                    (CASE WHEN pac.created_at_mismatch IS NOT NULL THEN
                        jsonb_build_object('field', pac.created_at_mismatch, 'profile_value', to_jsonb(p.created_at), 'auth_value', to_jsonb(u.created_at), 'direction', 'auth_to_profile')
                    END),
                    (CASE WHEN pac.confirmed_at_mismatch IS NOT NULL THEN
                        jsonb_build_object('field', pac.confirmed_at_mismatch, 'profile_value', to_jsonb(p.confirmed_at), 'auth_value', to_jsonb(u.confirmed_at), 'direction', 'auth_to_profile')
                    END),
                    (CASE WHEN pac.last_sign_in_at_mismatch IS NOT NULL THEN
                        jsonb_build_object('field', pac.last_sign_in_at_mismatch, 'profile_value', to_jsonb(p.last_sign_in_at), 'auth_value', to_jsonb(u.last_sign_in_at), 'direction', 'auth_to_profile')
                    END),
                    (CASE WHEN pac.banned_until_mismatch IS NOT NULL THEN
                        jsonb_build_object('field', pac.banned_until_mismatch, 'profile_value', to_jsonb(p.banned_until), 'auth_value', to_jsonb(u.banned_until), 'direction', 'auth_to_profile')
                    END),
                    (CASE WHEN pac.avatar_url_mismatch IS NOT NULL THEN
                        jsonb_build_object('field', pac.avatar_url_mismatch, 'profile_value', to_jsonb(p.avatar_url), 'auth_value', to_jsonb(u.raw_user_meta_data->>'avatar_url'), 'direction', 'auth_to_profile')
                    END),
                    (CASE WHEN pac.phone_mismatch IS NOT NULL THEN
                        jsonb_build_object('field', pac.phone_mismatch, 'profile_value', to_jsonb(p.phone), 'auth_value', to_jsonb(u.phone), 'direction', 'profile_to_auth')
                    END),
                    (CASE WHEN pac.display_name_full_name_mismatch IS NOT NULL THEN
                        jsonb_build_object('field', pac.display_name_full_name_mismatch, 'profile_value', to_jsonb(p.display_name), 'auth_value', to_jsonb(u.raw_user_meta_data->>'full_name'), 'direction', 'profile_to_auth')
                    END),
                    (CASE WHEN pac.display_name_name_mismatch IS NOT NULL THEN
                        jsonb_build_object('field', pac.display_name_name_mismatch, 'profile_value', to_jsonb(p.display_name), 'auth_value', to_jsonb(u.raw_user_meta_data->>'name'), 'direction', 'profile_to_auth')
                    END),
                    (CASE WHEN pac.role_mismatch IS NOT NULL THEN
                        jsonb_build_object('field', pac.role_mismatch, 'profile_value', to_jsonb(p.role::text), 'auth_value', to_jsonb(u.raw_app_meta_data->>'role'), 'direction', 'bidirectional')
                    END),
                    (CASE WHEN pac.providers_mismatch IS NOT NULL THEN
                        jsonb_build_object(
                            'field', pac.providers_mismatch,
                            'profile_value', to_jsonb(p.providers),
                            'auth_value', to_jsonb((
                                SELECT ARRAY_AGG(DISTINCT provider ORDER BY provider)
                                FROM auth.identities
                                WHERE user_id = u.id
                            )),
                            'direction', 'auth_to_profile'
                        )
                    END)
            ) AS t(detail)
            WHERE detail IS NOT NULL
        ) mismatch_details
    )
    SELECT 
        user_id,
        email,
        CASE 
            WHEN mismatch_details.jsonb_agg IS NULL OR jsonb_array_length(mismatch_details.jsonb_agg) = 0 THEN 'in_sync'
            ELSE 'out_of_sync'
        END as sync_status,
        COALESCE(mismatch_details.jsonb_agg, '[]'::jsonb) as out_of_sync_fields,
        profiles_updated_at,
        auth_users_updated_at,
        jsonb_build_object(
            'total_mismatches', COALESCE(jsonb_array_length(mismatch_details.jsonb_agg), 0),
            'last_profile_update', profiles_updated_at,
            'last_auth_update', auth_users_updated_at,
            'time_difference', EXTRACT(EPOCH FROM (profiles_updated_at - auth_users_updated_at)),
            'mismatch_breakdown', (
                SELECT jsonb_object_agg(
                    direction, 
                    COUNT(*) FILTER (WHERE field IS NOT NULL)
                )
                FROM jsonb_array_elements(mismatch_details.jsonb_agg) elem,
                     jsonb_to_record(elem) as x(field text, profile_value jsonb, auth_value jsonb, direction text)
            )
        ) as details
    FROM sync_analysis;
END;
$$;

-- Helper function: Get sync summary statistics
CREATE OR REPLACE FUNCTION public.get_sync_summary()
RETURNS TABLE (
    total_users bigint,
    in_sync_count bigint,
    out_of_sync_count bigint,
    sync_percentage numeric,
    most_common_mismatches jsonb,
    users_needing_attention bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
    RETURN QUERY
    WITH sync_data AS (
        SELECT * FROM public.report_profile_auth_sync()
    ),
    mismatch_stats AS (
        SELECT 
            jsonb_agg(
                jsonb_build_object(
                    'field', elem->>'field',
                    'count', COUNT(*),
                    'direction', elem->>'direction'
                )
            ) as field_breakdown
        FROM sync_data sd
        CROSS JOIN LATERAL jsonb_array_elements(sd.out_of_sync_fields) elem
        WHERE sd.sync_status = 'out_of_sync'
    )
    SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE sync_status = 'in_sync') as in_sync_count,
        COUNT(*) FILTER (WHERE sync_status = 'out_of_sync') as out_of_sync_count,
        ROUND(
            (COUNT(*) FILTER (WHERE sync_status = 'in_sync')::numeric / COUNT(*)::numeric) * 100, 2
        ) as sync_percentage,
        COALESCE(
            (SELECT field_breakdown FROM mismatch_stats),
            '[]'::jsonb
        ) as most_common_mismatches,
        COUNT(*) FILTER (
            WHERE sync_status = 'out_of_sync' 
            AND jsonb_array_length(out_of_sync_fields) > 2
        ) as users_needing_attention
    FROM sync_data;
END;
$$;

-- Helper function: Fix common sync issues
CREATE OR REPLACE FUNCTION public.fix_sync_issues(
    user_id_param uuid DEFAULT NULL,
    fix_auth_to_profile boolean DEFAULT true,
    fix_profile_to_auth boolean DEFAULT true,
    dry_run boolean DEFAULT false
)
RETURNS TABLE (
    user_id uuid,
    email text,
    fixes_applied jsonb,
    status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
    sync_record RECORD;
    fixes jsonb;
BEGIN
    FOR sync_record IN 
        SELECT * FROM public.report_profile_auth_sync() 
        WHERE (user_id_param IS NULL OR user_id = user_id_param)
          AND sync_status = 'out_of_sync'
    LOOP
        fixes := '[]'::jsonb;
        
        IF fix_auth_to_profile THEN
            -- Fix auth.users -> profiles sync issues
            IF EXISTS (
                SELECT 1 FROM jsonb_array_elements(sync_record.out_of_sync_fields) elem
                WHERE elem->>'direction' = 'auth_to_profile'
            ) THEN
                IF NOT dry_run THEN
                    UPDATE public.profiles
                    SET
                        created_at = u.created_at,
                        confirmed_at = u.confirmed_at,
                        last_sign_in_at = u.last_sign_in_at,
                        banned_until = u.banned_until,
                        avatar_url = COALESCE(u.raw_user_meta_data->>'avatar_url', profiles.avatar_url),
                        providers = (
                            SELECT ARRAY_AGG(DISTINCT provider ORDER BY provider)
                            FROM auth.identities i
                            WHERE i.user_id = u.id
                        ),
                        updated_at = NOW()
                    FROM auth.users u
                    WHERE profiles.id = u.id AND profiles.id = sync_record.user_id;
                END IF;
                
                fixes := fixes || jsonb_build_object(
                    'type', 'auth_to_profile_sync',
                    'fixed', NOT dry_run,
                    'timestamp', NOW()
                );
            END IF;
        END IF;
        
        IF fix_profile_to_auth THEN
            -- Fix profiles -> auth.users sync issues
            IF EXISTS (
                SELECT 1 FROM jsonb_array_elements(sync_record.out_of_sync_fields) elem
                WHERE elem->>'direction' IN ('profile_to_auth', 'bidirectional')
            ) THEN
                IF NOT dry_run THEN
                    UPDATE auth.users
                    SET
                        phone = p.phone,
                        raw_user_meta_data = jsonb_set(
                            jsonb_set(
                                COALESCE(raw_user_meta_data, '{}'::jsonb),
                                '{full_name}',
                                to_jsonb(p.display_name)
                            ),
                            '{name}',
                            to_jsonb(p.display_name)
                        ),
                        raw_app_meta_data = jsonb_set(
                            COALESCE(raw_app_meta_data, '{}'::jsonb),
                            '{role}',
                            to_jsonb(p.role::text)
                        ),
                        updated_at = NOW()
                    FROM public.profiles p
                    WHERE auth.users.id = p.id AND auth.users.id = sync_record.user_id;
                END IF;
                
                fixes := fixes || jsonb_build_object(
                    'type', 'profile_to_auth_sync',
                    'fixed', NOT dry_run,
                    'timestamp', NOW()
                );
            END IF;
        END IF;
        
        user_id := sync_record.user_id;
        email := sync_record.email;
        fixes_applied := fixes;
        status := CASE WHEN jsonb_array_length(fixes) > 0 THEN 'fixed' ELSE 'no_changes' END;
        RETURN NEXT;
     END LOOP;
    END LOOP;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.report_profile_auth_sync() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_sync_summary() TO service_role;
GRANT EXECUTE ON FUNCTION public.fix_sync_issues(uuid, boolean, boolean, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_user_role(uuid, public.user_role) TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_auth_user_updates() TO authenticated, service_role;

-- Comments
COMMENT ON FUNCTION public.report_profile_auth_sync() IS 'Reports detailed synchronization status between profiles and auth.users tables, showing mismatched fields and their values';
COMMENT ON FUNCTION public.get_sync_summary() IS 'Provides summary statistics for profile-auth synchronization across all users';
COMMENT ON FUNCTION public.fix_sync_issues(uuid, boolean, boolean, boolean) IS 'Fixes synchronization issues between profiles and auth.users. Requires service_role for actual fixes';
COMMENT ON FUNCTION public.update_user_role(uuid, public.user_role) IS 'Securely updates a user role. Only admins and roots can change roles. Requires service_role permissions.';
COMMENT ON FUNCTION public.sync_auth_user_updates() IS 'Automatically syncs confirmed_at, last_sign_in_at, banned_until, and providers from auth.users to profiles when updated';

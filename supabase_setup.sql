-- 1. Create a comprehensive profiles table to prevent future migrations
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    full_name TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    profession TEXT DEFAULT '', -- doctor, researcher, student, other, etc.
    phone TEXT DEFAULT '',
    country TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Define RLS Policies
-- Allow anyone to read profiles
CREATE POLICY "Allow public read access on profiles" 
ON public.profiles FOR SELECT 
USING (true);

-- Allow users to update their own profiles
CREATE POLICY "Allow users to update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- 3. Trigger function to automatically create a profile and extract metadata from OAuth (Google, Facebook, Apple, X, Instagram)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    oauth_name TEXT;
    oauth_avatar TEXT;
BEGIN
    -- Extract full name and avatar from metadata if they exist (common for Google/Facebook OAuth)
    oauth_name := COALESCE(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        ''
    );
    oauth_avatar := COALESCE(
        new.raw_user_meta_data->>'avatar_url',
        new.raw_user_meta_data->>'picture',
        ''
    );

    INSERT INTO public.profiles (id, email, role, full_name, avatar_url)
    VALUES (
        new.id, 
        new.email, 
        'user', 
        oauth_name, 
        oauth_avatar
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Attach the trigger to auth.users insertions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Auto-update updated_at timestamp helper
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    new.updated_at = timezone('utc'::text, now());
    RETURN new;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

-- =========================================================================
-- HOW TO PROMOTE A USER TO ADMIN:
-- Run this SQL query in the Supabase SQL Editor:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin-email-here@example.com';
-- =========================================================================

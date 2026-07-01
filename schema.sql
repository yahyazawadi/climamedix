-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'user'::text CHECK (role = ANY (ARRAY['user'::text, 'subscriber'::text, 'researcher'::text, 'educator'::text, 'admin'::text, 'superadmin'::text])),
  full_name text DEFAULT ''::text,
  avatar_url text DEFAULT ''::text,
  profession text DEFAULT ''::text,
  phone text DEFAULT ''::text,
  country text DEFAULT ''::text,
  bio text DEFAULT ''::text,
  online boolean DEFAULT false,
  last_seen timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  birthdate date,
  gender text DEFAULT ''::text,
  linkedin_url text DEFAULT ''::text,
  twitter_url text DEFAULT ''::text,
  facebook_url text DEFAULT ''::text,
  github_url text DEFAULT ''::text,
  city text DEFAULT ''::text,
  is_researcher boolean DEFAULT false,
  field_of_research text DEFAULT ''::text,
  title text DEFAULT 'Mr'::text CHECK (title = ANY (ARRAY['Dr'::text, 'Prof'::text, 'Mr'::text, 'Ms'::text])),
  university_or_org text DEFAULT ''::text,
  specialty text DEFAULT ''::text,
  is_activist boolean DEFAULT false,
  field_of_activism text DEFAULT ''::text,
  instagram_url text DEFAULT ''::text,
  snapchat_url text DEFAULT ''::text,
  tiktok_url text DEFAULT ''::text,
  threads_url text DEFAULT ''::text,
  youtube_url text DEFAULT ''::text,
  whatsapp_number text DEFAULT ''::text,
  telegram_username text DEFAULT ''::text,
  discord_username text DEFAULT ''::text,
  medium_url text DEFAULT ''::text,
  researchgate_url text DEFAULT ''::text,
  google_scholar_url text DEFAULT ''::text,
  orcid_id text DEFAULT ''::text,
  website_url text DEFAULT ''::text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  role_name text NOT NULL UNIQUE,
  description text,
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);
CREATE TABLE public.permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  perm_key text NOT NULL UNIQUE,
  description text,
  CONSTRAINT permissions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.role_permissions (
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id),
  CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id)
);
CREATE TABLE public.user_roles (
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);
CREATE TABLE public.user_permissions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  resource_type text,
  resource_id uuid,
  is_granted boolean DEFAULT true,
  CONSTRAINT user_permissions_pkey PRIMARY KEY (id),
  CONSTRAINT user_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id)
);
CREATE TABLE public.courses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title_ar text NOT NULL,
  title_en text,
  description_ar text,
  description_en text,
  category text NOT NULL,
  cover_image text,
  duration text,
  teaser_permission_key text DEFAULT 'view:public_content'::text,
  full_access_permission_key text DEFAULT 'view:all_courses'::text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT courses_pkey PRIMARY KEY (id),
  CONSTRAINT courses_teaser_permission_key_fkey FOREIGN KEY (teaser_permission_key) REFERENCES public.permissions(perm_key),
  CONSTRAINT courses_full_access_permission_key_fkey FOREIGN KEY (full_access_permission_key) REFERENCES public.permissions(perm_key),
  CONSTRAINT courses_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.modules (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  title_ar text NOT NULL,
  title_en text,
  description_ar text,
  description_en text,
  sequence_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT modules_pkey PRIMARY KEY (id),
  CONSTRAINT modules_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.lessons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL,
  title_ar text NOT NULL,
  title_en text,
  content_ar text,
  content_en text,
  video_url text,
  audio_url text,
  pdf_url text,
  duration text,
  sequence_order integer DEFAULT 0,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  is_quiz boolean DEFAULT false,
  CONSTRAINT lessons_pkey PRIMARY KEY (id),
  CONSTRAINT lessons_module_id_fkey FOREIGN KEY (module_id) REFERENCES public.modules(id),
  CONSTRAINT lessons_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.enrollments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL,
  enrolled_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'completed'::text, 'dropped'::text])),
  CONSTRAINT enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT enrollments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT enrollments_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id)
);
CREATE TABLE public.lesson_completions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL,
  completed_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT lesson_completions_pkey PRIMARY KEY (id),
  CONSTRAINT lesson_completions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT lesson_completions_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id)
);
CREATE TABLE public.quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL,
  lesson_id uuid,
  title_ar text NOT NULL,
  title_en text,
  passing_score integer DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT quizzes_pkey PRIMARY KEY (id),
  CONSTRAINT quizzes_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(id),
  CONSTRAINT quizzes_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES public.lessons(id)
);
CREATE TABLE public.quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  quiz_id uuid NOT NULL,
  question_text_ar text NOT NULL,
  question_text_en text,
  points integer DEFAULT 1 CHECK (points >= 0),
  sequence_order integer DEFAULT 0,
  CONSTRAINT quiz_questions_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id)
);
CREATE TABLE public.quiz_options (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL,
  option_text_ar text NOT NULL,
  option_text_en text,
  is_correct boolean DEFAULT false,
  CONSTRAINT quiz_options_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_options_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.quiz_questions(id)
);
CREATE TABLE public.quiz_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quiz_id uuid NOT NULL,
  score integer NOT NULL CHECK (score >= 0 AND score <= 100),
  passed boolean NOT NULL,
  attempted_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT quiz_attempts_pkey PRIMARY KEY (id),
  CONSTRAINT quiz_attempts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT quiz_attempts_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quizzes(id)
);
CREATE TABLE public.applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['researcher'::text, 'educator'::text])),
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text])),
  cv_url text,
  motivation text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT applications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.publications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title_ar text NOT NULL,
  title_en text,
  authors text NOT NULL,
  abstract_ar text,
  abstract_en text,
  pdf_url text,
  external_link text,
  category text CHECK (category = ANY (ARRAY['climate'::text, 'health'::text, 'policy'::text, 'all'::text])),
  year text,
  teaser_permission_key text DEFAULT 'view:public_content'::text,
  full_access_permission_key text DEFAULT 'view:free_content'::text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT publications_pkey PRIMARY KEY (id),
  CONSTRAINT publications_teaser_permission_key_fkey FOREIGN KEY (teaser_permission_key) REFERENCES public.permissions(perm_key),
  CONSTRAINT publications_full_access_permission_key_fkey FOREIGN KEY (full_access_permission_key) REFERENCES public.permissions(perm_key),
  CONSTRAINT publications_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);
CREATE TABLE public.opportunities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title_ar text NOT NULL,
  title_en text,
  type text NOT NULL CHECK (type = ANY (ARRAY['fellowship'::text, 'scholarship'::text, 'internship'::text, 'conference'::text, 'grant'::text])),
  description_ar text,
  description_en text,
  eligibility_ar text,
  eligibility_en text,
  deadline date,
  apply_link text,
  created_by uuid DEFAULT auth.uid(),
  teaser_permission_key text DEFAULT 'view:public_content'::text,
  full_access_permission_key text DEFAULT 'view:free_content'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT opportunities_pkey PRIMARY KEY (id),
  CONSTRAINT opportunities_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT opportunities_teaser_permission_key_fkey FOREIGN KEY (teaser_permission_key) REFERENCES public.permissions(perm_key),
  CONSTRAINT opportunities_full_access_permission_key_fkey FOREIGN KEY (full_access_permission_key) REFERENCES public.permissions(perm_key)
);
CREATE TABLE public.events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title_ar text NOT NULL,
  title_en text,
  description_ar text,
  description_en text,
  event_date timestamp with time zone NOT NULL,
  time text,
  type_ar text,
  registration_link text,
  created_by uuid DEFAULT auth.uid(),
  teaser_permission_key text DEFAULT 'view:public_content'::text,
  full_access_permission_key text DEFAULT 'view:public_content'::text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  type_en text,
  CONSTRAINT events_pkey PRIMARY KEY (id),
  CONSTRAINT events_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT events_teaser_permission_key_fkey FOREIGN KEY (teaser_permission_key) REFERENCES public.permissions(perm_key),
  CONSTRAINT events_full_access_permission_key_fkey FOREIGN KEY (full_access_permission_key) REFERENCES public.permissions(perm_key)
);
CREATE TABLE public.news_articles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title_ar text NOT NULL,
  title_en text,
  content_ar text,
  content_en text,
  category text CHECK (category = ANY (ARRAY['climate_health'::text, 'research'::text, 'opportunities'::text, 'events'::text])),
  cover_image text,
  author_name text,
  created_by uuid DEFAULT auth.uid(),
  teaser_permission_key text DEFAULT 'view:public_content'::text,
  full_access_permission_key text DEFAULT 'view:free_content'::text,
  published_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  views_count integer DEFAULT 0,
  CONSTRAINT news_articles_pkey PRIMARY KEY (id),
  CONSTRAINT news_articles_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id),
  CONSTRAINT news_articles_teaser_permission_key_fkey FOREIGN KEY (teaser_permission_key) REFERENCES public.permissions(perm_key),
  CONSTRAINT news_articles_full_access_permission_key_fkey FOREIGN KEY (full_access_permission_key) REFERENCES public.permissions(perm_key)
);
CREATE TABLE public.certificates (
  id text NOT NULL,
  user_id uuid,
  name text NOT NULL,
  course text NOT NULL,
  email text NOT NULL,
  issued_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT certificates_pkey PRIMARY KEY (id),
  CONSTRAINT certificates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.join_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  profession text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  city text,
  country text,
  birth_date date,
  university_org text,
  work text,
  is_activist boolean DEFAULT false,
  activist_field text,
  bio text,
  cv_url text,
  track text CHECK (track = ANY (ARRAY['research'::text, 'educator'::text])),
  is_researcher boolean DEFAULT false,
  researcher_field text,
  CONSTRAINT join_requests_pkey PRIMARY KEY (id)
);
CREATE TABLE public.article_reactions (
  article_id uuid NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT article_reactions_pkey PRIMARY KEY (article_id, user_id),
  CONSTRAINT article_reactions_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.news_articles(id),
  CONSTRAINT article_reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.article_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  article_id uuid,
  user_id uuid DEFAULT auth.uid(),
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT article_comments_pkey PRIMARY KEY (id),
  CONSTRAINT article_comments_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.news_articles(id),
  CONSTRAINT article_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.news_map_nodes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  latitude numeric NOT NULL,
  longitude numeric NOT NULL,
  radius_km numeric DEFAULT 0,
  icon_type text DEFAULT 'danger'::text,
  description_ar text,
  description_en text,
  link text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT news_map_nodes_pkey PRIMARY KEY (id),
  CONSTRAINT news_map_nodes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.profiles(id)
);

-- Supabase setup for ClimaMedix PWA
-- ------------------------------------------------------------
-- 1. Core tables
-- ------------------------------------------------------------

-- Roles table
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name TEXT UNIQUE NOT NULL,
    description TEXT
);

-- Permissions table
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    perm_key TEXT UNIQUE NOT NULL,
    description TEXT
);

-- Role-permission mapping table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- Profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    title TEXT DEFAULT 'Mr' CHECK (title IN ('Dr', 'Prof', 'Mr', 'Ms')),
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'subscriber', 'researcher', 'educator', 'admin', 'superadmin')),
    full_name TEXT DEFAULT '',
    avatar_url TEXT DEFAULT '',
    profession TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    country TEXT DEFAULT '',
    city TEXT DEFAULT '',
    university_or_org TEXT DEFAULT '',
    specialty TEXT DEFAULT '',
    is_activist BOOLEAN DEFAULT FALSE,
    field_of_activism TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    birthdate DATE,
    gender TEXT DEFAULT '',
    linkedin_url TEXT DEFAULT '',
    twitter_url TEXT DEFAULT '',
    facebook_url TEXT DEFAULT '',
    instagram_url TEXT DEFAULT '',
    snapchat_url TEXT DEFAULT '',
    tiktok_url TEXT DEFAULT '',
    threads_url TEXT DEFAULT '',
    youtube_url TEXT DEFAULT '',
    whatsapp_number TEXT DEFAULT '',
    telegram_username TEXT DEFAULT '',
    discord_username TEXT DEFAULT '',
    medium_url TEXT DEFAULT '',
    researchgate_url TEXT DEFAULT '',
    google_scholar_url TEXT DEFAULT '',
    orcid_id TEXT DEFAULT '',
    website_url TEXT DEFAULT '',
    github_url TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- User-role mapping table
CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- Direct/scoped user permissions table (uses surrogate key + unique indexes instead of nullable PK)
CREATE TABLE IF NOT EXISTS public.user_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    permission_id UUID REFERENCES public.permissions(id) ON DELETE CASCADE NOT NULL,
    resource_type TEXT,      -- e.g. "course" or "article"
    resource_id UUID,        -- specific row if scoped, NULL for global
    is_granted BOOLEAN DEFAULT TRUE,
    CONSTRAINT chk_scoped_fields CHECK (
        (resource_type IS NULL AND resource_id IS NULL) OR
        (resource_type IS NOT NULL AND resource_id IS NOT NULL)
    )
);

-- Uniqueness indexes for user_permissions (standard fallback for nullable unique constraint)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_perms_unique_global 
ON public.user_permissions (user_id, permission_id) 
WHERE resource_type IS NULL AND resource_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_perms_unique_scoped 
ON public.user_permissions (user_id, permission_id, resource_type, resource_id) 
WHERE resource_type IS NOT NULL AND resource_id IS NOT NULL;

-- Courses
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_ar TEXT NOT NULL,
    title_en TEXT,
    description_ar TEXT,
    description_en TEXT,
    category TEXT NOT NULL,
    cover_image TEXT,
    duration TEXT,
    teaser_permission_key TEXT DEFAULT 'view:public_content' REFERENCES public.permissions(perm_key) ON DELETE SET DEFAULT,
    full_access_permission_key TEXT DEFAULT 'view:all_courses' REFERENCES public.permissions(perm_key) ON DELETE SET DEFAULT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Modules – inherit from course, no permission columns
CREATE TABLE IF NOT EXISTS public.modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    title_ar TEXT NOT NULL,
    title_en TEXT,
    description_ar TEXT,
    description_en TEXT,
    sequence_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Lessons – ownable, plus media fields
CREATE TABLE IF NOT EXISTS public.lessons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE NOT NULL,
    title_ar TEXT NOT NULL,
    title_en TEXT,
    content_ar TEXT,
    content_en TEXT,
    video_url TEXT,
    audio_url TEXT,
    pdf_url TEXT,
    duration TEXT,
    sequence_order INT DEFAULT 0,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------
-- 2. LMS & Progress tables
-- ------------------------------------------------------------

-- Course enrollments
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dropped')),
    UNIQUE (user_id, course_id)
);

-- Lesson progress tracking
CREATE TABLE IF NOT EXISTS public.lesson_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, lesson_id)
);

-- Quizzes table
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
    lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
    title_ar TEXT NOT NULL,
    title_en TEXT,
    passing_score INT DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Quiz questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    question_text_ar TEXT NOT NULL,
    question_text_en TEXT,
    points INT DEFAULT 1 CHECK (points >= 0),
    sequence_order INT DEFAULT 0
);

-- Quiz options
CREATE TABLE IF NOT EXISTS public.quiz_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES public.quiz_questions(id) ON DELETE CASCADE NOT NULL,
    option_text_ar TEXT NOT NULL,
    option_text_en TEXT,
    is_correct BOOLEAN DEFAULT FALSE
);

-- Quiz attempts/results
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    quiz_id UUID REFERENCES public.quizzes(id) ON DELETE CASCADE NOT NULL,
    score INT NOT NULL CHECK (score >= 0 AND score <= 100),
    passed BOOLEAN NOT NULL,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ------------------------------------------------------------
-- 3. Permission helper functions & views
-- ------------------------------------------------------------

-- Helper to check permissions with fallback to roles and direct scoped grant/revoke checks
CREATE OR REPLACE FUNCTION public.has_permission(
    user_id UUID,
    required_perm TEXT,
    resource_type TEXT DEFAULT NULL,
    resource_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    perm_id UUID;
    is_revoked BOOLEAN;
    is_granted_directly BOOLEAN;
    has_role_perm BOOLEAN;
BEGIN
    -- 0. Privacy Guard: Only allow checking own permissions, unless caller is admin/superadmin/system
    IF user_id IS DISTINCT FROM auth.uid() AND NOT (
        (auth.uid() IS NULL AND auth.role() IS DISTINCT FROM 'anon') OR EXISTS (
            SELECT 1 FROM public.user_roles ur
            JOIN public.roles r ON ur.role_id = r.id
            WHERE ur.user_id = auth.uid() AND r.role_name IN ('admin', 'superadmin')
        )
    ) THEN
        RETURN FALSE;
    END IF;

    -- 0a. Public access bypass
    IF required_perm = 'view:public_content' THEN
        RETURN TRUE;
    END IF;

    -- 1. Get the permission ID
    SELECT id INTO perm_id FROM public.permissions WHERE perm_key = required_perm;
    IF perm_id IS NULL THEN
        RETURN FALSE;
    END IF;

    -- 2. Check for explicit revoke at the requested scope
    IF resource_type IS NOT NULL AND resource_id IS NOT NULL THEN
        SELECT TRUE INTO is_revoked 
        FROM public.user_permissions 
        WHERE user_permissions.user_id = has_permission.user_id 
          AND user_permissions.permission_id = perm_id
          AND user_permissions.resource_type = has_permission.resource_type
          AND user_permissions.resource_id = has_permission.resource_id
          AND user_permissions.is_granted = FALSE;
          
        IF is_revoked = TRUE THEN
            RETURN FALSE;
        END IF;
    END IF;

    -- 3. Check for explicit global revoke
    SELECT TRUE INTO is_revoked 
    FROM public.user_permissions 
    WHERE user_permissions.user_id = has_permission.user_id 
      AND user_permissions.permission_id = perm_id
      AND user_permissions.resource_type IS NULL
      AND user_permissions.resource_id IS NULL
      AND user_permissions.is_granted = FALSE;
      
    IF is_revoked = TRUE THEN
        RETURN FALSE;
    END IF;

    -- 4. Check for explicit grant at the requested scope
    IF resource_type IS NOT NULL AND resource_id IS NOT NULL THEN
        SELECT TRUE INTO is_granted_directly 
        FROM public.user_permissions 
        WHERE user_permissions.user_id = has_permission.user_id 
          AND user_permissions.permission_id = perm_id
          AND user_permissions.resource_type = has_permission.resource_type
          AND user_permissions.resource_id = has_permission.resource_id
          AND user_permissions.is_granted = TRUE;
          
        IF is_granted_directly = TRUE THEN
            RETURN TRUE;
        END IF;
    END IF;

    -- 5. Check for explicit global direct grant
    SELECT TRUE INTO is_granted_directly 
    FROM public.user_permissions 
    WHERE user_permissions.user_id = has_permission.user_id 
      AND user_permissions.permission_id = perm_id
      AND user_permissions.resource_type IS NULL
      AND user_permissions.resource_id IS NULL
      AND user_permissions.is_granted = TRUE;
          
    IF is_granted_directly = TRUE THEN
        RETURN TRUE;
    END IF;

    -- 6. Check for role-based grant
    SELECT EXISTS (
        SELECT 1 
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.role_id = rp.role_id
        WHERE ur.user_id = has_permission.user_id 
          AND rp.permission_id = perm_id
    ) INTO has_role_perm;

    RETURN has_role_perm;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Resolved permissions view
CREATE OR REPLACE VIEW public.user_resolved_permissions AS
WITH role_perms AS (
    SELECT ur.user_id, rp.permission_id, NULL::TEXT AS resource_type, NULL::UUID AS resource_id
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
),
direct_perms AS (
    SELECT up.user_id, up.permission_id, up.resource_type, up.resource_id
    FROM public.user_permissions up
    WHERE up.is_granted = TRUE
),
combined AS (
    SELECT * FROM role_perms
    UNION DISTINCT
    SELECT * FROM direct_perms
)
SELECT c.user_id,
       p.id AS permission_id,
       p.perm_key,
       c.resource_type,
       c.resource_id
FROM combined c
JOIN public.permissions p ON c.permission_id = p.id
WHERE (c.user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON ur.role_id = r.id
    WHERE ur.user_id = auth.uid() AND r.role_name IN ('admin', 'superadmin')
))
AND NOT EXISTS (
    SELECT 1 
    FROM public.user_permissions up
    WHERE up.user_id = c.user_id
      AND up.permission_id = c.permission_id
      AND up.is_granted = FALSE
      AND (
          (up.resource_type IS NULL AND up.resource_id IS NULL)
          OR (up.resource_type = c.resource_type AND up.resource_id = c.resource_id)
      )
);

-- Quiz options accessible view (masks is_correct)
CREATE OR REPLACE VIEW public.quiz_options_accessible AS
SELECT id, question_id, option_text_ar, option_text_en
FROM public.quiz_options;

-- Secure server-side quiz grading function
CREATE OR REPLACE FUNCTION public.submit_quiz_attempt(
    p_quiz_id UUID,
    p_answers JSONB -- e.g. [{"question_id": "...", "option_id": "..."}]
)
RETURNS JSONB AS $$
DECLARE
    v_total_questions INT;
    v_correct_answers INT := 0;
    v_score INT;
    v_passing_score INT;
    v_passed BOOLEAN;
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User must be signed in.';
    END IF;

    -- Get passing score
    SELECT passing_score INTO v_passing_score FROM public.quizzes WHERE id = p_quiz_id;
    IF v_passing_score IS NULL THEN
        RAISE EXCEPTION 'Quiz not found.';
    END IF;

    -- Check if user is actively enrolled in the course associated with this quiz
    IF NOT EXISTS (
        SELECT 1 FROM public.quizzes q
        JOIN public.enrollments e ON q.course_id = e.course_id
        WHERE q.id = p_quiz_id AND e.user_id = v_user_id AND e.status = 'active'
    ) THEN
        RAISE EXCEPTION 'Unauthorized: User is not actively enrolled in the course for this quiz.';
    END IF;

    -- Prevent duplicate answers for the same question to avoid exploits
    IF p_answers IS NOT NULL AND jsonb_typeof(p_answers) = 'array' THEN
        IF (SELECT COUNT(DISTINCT question_id) FROM jsonb_to_recordset(p_answers) AS x(question_id UUID)) < jsonb_array_length(p_answers) THEN
            RAISE EXCEPTION 'Invalid submission: Multiple answers submitted for a single question.';
        END IF;
    END IF;

    -- Count total questions in the quiz
    SELECT COUNT(*) INTO v_total_questions FROM public.quiz_questions WHERE quiz_id = p_quiz_id;
    IF v_total_questions = 0 THEN
        RAISE EXCEPTION 'Quiz has no questions.';
    END IF;

    -- Grade answers by checking unique questions in a single query
    SELECT COALESCE(COUNT(*), 0) INTO v_correct_answers
    FROM (
        SELECT DISTINCT ON (x.question_id) x.question_id, qo.is_correct
        FROM jsonb_to_recordset(p_answers) AS x(question_id UUID, option_id UUID)
        JOIN public.quiz_options qo ON qo.id = x.option_id AND qo.question_id = x.question_id
        JOIN public.quiz_questions qq ON qq.id = x.question_id
        WHERE qq.quiz_id = p_quiz_id
        ORDER BY x.question_id, qo.is_correct DESC
    ) graded
    WHERE graded.is_correct = TRUE;

    -- Calculate score percentage
    v_score := ROUND((v_correct_answers::FLOAT / v_total_questions::FLOAT) * 100);
    v_passed := v_score >= v_passing_score;

    -- Insert attempt
    INSERT INTO public.quiz_attempts (user_id, quiz_id, score, passed)
    VALUES (v_user_id, p_quiz_id, v_score, v_passed);

    RETURN jsonb_build_object(
        'score', v_score,
        'passed', v_passed,
        'correct_answers', v_correct_answers,
        'total_questions', v_total_questions
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Secure server-side certificate claiming function
CREATE OR REPLACE FUNCTION public.claim_certificate(
    p_course_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_total_lessons INT;
    v_completed_lessons INT;
    v_user_name TEXT;
    v_user_email TEXT;
    v_course_title TEXT;
    v_cert_id TEXT;
BEGIN
    -- 1. Privacy Guard: Only allow authenticated users to claim certificates
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User must be signed in.';
    END IF;

    -- 2. Verify active enrollment
    IF NOT EXISTS (
        SELECT 1 FROM public.enrollments 
        WHERE course_id = p_course_id AND user_id = v_user_id AND status = 'active'
    ) THEN
        RAISE EXCEPTION 'Error: You must have an active enrollment in this course to claim a certificate.';
    END IF;

    -- 3. Verify all course lessons have been completed by the user
    SELECT COUNT(*) INTO v_total_lessons 
    FROM public.lessons l
    JOIN public.modules m ON l.module_id = m.id 
    WHERE m.course_id = p_course_id;

    SELECT COUNT(DISTINCT lc.lesson_id) INTO v_completed_lessons
    FROM public.lesson_completions lc
    JOIN public.lessons l ON lc.lesson_id = l.id
    JOIN public.modules m ON l.module_id = m.id
    WHERE m.course_id = p_course_id AND lc.user_id = v_user_id;

    IF v_completed_lessons < v_total_lessons OR v_total_lessons = 0 THEN
        RAISE EXCEPTION 'Error: You have not completed all lessons in this course (% of % completed).', v_completed_lessons, v_total_lessons;
    END IF;

    -- 4. Verify all quizzes for this course have been passed by the user
    IF EXISTS (
        SELECT 1 FROM public.quizzes q 
        WHERE q.course_id = p_course_id
          AND NOT EXISTS (
              SELECT 1 FROM public.quiz_attempts qa 
              WHERE qa.quiz_id = q.id AND qa.user_id = v_user_id AND qa.passed = TRUE
          )
    ) THEN
        RAISE EXCEPTION 'Error: You must pass all quizzes associated with this course before claiming a certificate.';
    END IF;

    -- 5. Gather profile and course information
    SELECT full_name, email INTO v_user_name, v_user_email 
    FROM public.profiles 
    WHERE id = v_user_id;

    SELECT COALESCE(title_ar, title_en) INTO v_course_title 
    FROM public.courses 
    WHERE id = p_course_id;

    -- 6. Generate verification-safe unique certificate ID (e.g. CERT-YEAR-RANDOM)
    v_cert_id := 'CERT-' || to_char(now(), 'YYYY') || '-' || upper(substring(md5(random()::text) from 1 for 8));

    -- 7. Insert the certificate record
    INSERT INTO public.certificates (id, user_id, name, course, email)
    VALUES (v_cert_id, v_user_id, COALESCE(v_user_name, 'Student'), v_course_title, v_user_email);

    -- 8. Mark enrollment as completed
    UPDATE public.enrollments 
    SET status = 'completed' 
    WHERE course_id = p_course_id AND user_id = v_user_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'certificate_id', v_cert_id,
        'course_title', v_course_title
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ------------------------------------------------------------
-- 4. Profile & Auth triggers
-- ------------------------------------------------------------

-- Trigger to auto‑create profile + seed user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    oauth_name TEXT;
    oauth_avatar TEXT;
    default_role_id UUID;
BEGIN
    oauth_name := COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', '');
    oauth_avatar := COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '');
    
    INSERT INTO public.profiles (id, email, role, full_name, avatar_url)
    VALUES (new.id, new.email, 'user', oauth_name, oauth_avatar);
    
    SELECT id INTO default_role_id FROM public.roles WHERE role_name = 'user';
    IF default_role_id IS NOT NULL THEN
        INSERT INTO public.user_roles (user_id, role_id)
        VALUES (new.id, default_role_id)
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to sync email updates from auth.users to public.profiles
CREATE OR REPLACE FUNCTION public.handle_update_user()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.profiles
    SET email = NEW.email
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_update_user();

-- Trigger to keep user_roles in sync when profile.role changes
CREATE OR REPLACE FUNCTION public.sync_profile_role_to_rbac()
RETURNS TRIGGER AS $$
DECLARE
    target_role_id UUID;
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        SELECT id INTO target_role_id FROM public.roles WHERE role_name = NEW.role;
        IF target_role_id IS NOT NULL THEN
            DELETE FROM public.user_roles WHERE user_id = NEW.id;
            INSERT INTO public.user_roles (user_id, role_id)
            VALUES (NEW.id, target_role_id)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_profile_role_changed ON public.profiles;
CREATE TRIGGER on_profile_role_changed
    AFTER UPDATE OF role ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role_to_rbac();

-- Privilege escalation guard trigger (prevents normal users from updating their role field directly)
CREATE OR REPLACE FUNCTION public.check_profile_role_update()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        -- Super Admin role cannot be assigned or removed by any user (even admins)
        -- It can only be modified in a system/migration query (where auth.uid() is null)
        IF (NEW.role = 'superadmin' OR OLD.role = 'superadmin') AND auth.uid() IS NOT NULL THEN
            RAISE EXCEPTION 'Unauthorized: Super Admin role can only be assigned or removed via system configuration.';
        END IF;

        -- Other roles require admin permissions (approve:users or manage:system)
        IF NOT (
            public.has_permission(auth.uid(), 'approve:users')
            OR public.has_permission(auth.uid(), 'manage:system')
            OR auth.uid() IS NULL
        ) THEN
            RAISE EXCEPTION 'Unauthorized: Only administrators can change profile roles.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS check_profile_role_before_update ON public.profiles;
CREATE TRIGGER check_profile_role_before_update
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.check_profile_role_update();

-- Applications (role request workflow)
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('researcher','educator')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    cv_url TEXT,
    motivation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Trigger to automatically promote user role when their specialized application gets approved
CREATE OR REPLACE FUNCTION public.handle_application_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
        UPDATE public.profiles
        SET role = NEW.type
        WHERE id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_application_approved ON public.applications;
CREATE TRIGGER on_application_approved
    AFTER UPDATE OF status ON public.applications
    FOR EACH ROW EXECUTE FUNCTION public.handle_application_approval();

-- Trigger to automatically set reviewed_by and reviewed_at metadata when an application is processed
CREATE OR REPLACE FUNCTION public.handle_application_review_metadata()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status = 'pending' AND NEW.status IN ('approved', 'rejected') THEN
        NEW.reviewed_by = auth.uid();
        NEW.reviewed_at = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_application_reviewed ON public.applications;
CREATE TRIGGER on_application_reviewed
    BEFORE UPDATE OF status ON public.applications
    FOR EACH ROW EXECUTE FUNCTION public.handle_application_review_metadata();

-- Timestamp helper & trigger
CREATE OR REPLACE FUNCTION public.handle_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_profile_updated ON public.profiles;
CREATE TRIGGER on_profile_updated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

DROP TRIGGER IF EXISTS on_course_updated ON public.courses;
CREATE TRIGGER on_course_updated
    BEFORE UPDATE ON public.courses
    FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

DROP TRIGGER IF EXISTS on_module_updated ON public.modules;
CREATE TRIGGER on_module_updated
    BEFORE UPDATE ON public.modules
    FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

DROP TRIGGER IF EXISTS on_quiz_updated ON public.quizzes;
CREATE TRIGGER on_quiz_updated
    BEFORE UPDATE ON public.quizzes
    FOR EACH ROW EXECUTE FUNCTION public.handle_update_timestamp();

-- ------------------------------------------------------------
-- 5. Content tables (Publications, Opportunities, Events, News)
-- ------------------------------------------------------------

-- Publications – two permission keys
CREATE TABLE IF NOT EXISTS public.publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_ar TEXT NOT NULL,
    title_en TEXT,
    authors TEXT NOT NULL,
    abstract_ar TEXT,
    abstract_en TEXT,
    pdf_url TEXT,
    external_link TEXT,
    category TEXT CHECK (category IN ('climate','health','policy','all')),
    year TEXT,
    teaser_permission_key TEXT DEFAULT 'view:public_content' REFERENCES public.permissions(perm_key) ON DELETE SET DEFAULT,
    full_access_permission_key TEXT DEFAULT 'view:free_content' REFERENCES public.permissions(perm_key) ON DELETE SET DEFAULT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Opportunities – two permission keys
CREATE TABLE IF NOT EXISTS public.opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_ar TEXT NOT NULL,
    title_en TEXT,
    type TEXT NOT NULL CHECK (type IN ('fellowship','scholarship','internship','conference','grant')),
    description_ar TEXT,
    description_en TEXT,
    eligibility_ar TEXT,
    eligibility_en TEXT,
    deadline DATE,
    apply_link TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
    teaser_permission_key TEXT DEFAULT 'view:public_content' REFERENCES public.permissions(perm_key) ON DELETE SET DEFAULT,
    full_access_permission_key TEXT DEFAULT 'view:free_content' REFERENCES public.permissions(perm_key) ON DELETE SET DEFAULT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Events – two permission keys
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_ar TEXT NOT NULL,
    title_en TEXT,
    description_ar TEXT,
    description_en TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    time TEXT,
    type TEXT,
    registration_link TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
    teaser_permission_key TEXT DEFAULT 'view:public_content' REFERENCES public.permissions(perm_key) ON DELETE SET DEFAULT,
    full_access_permission_key TEXT DEFAULT 'view:public_content' REFERENCES public.permissions(perm_key) ON DELETE SET DEFAULT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- News articles – two permission keys
CREATE TABLE IF NOT EXISTS public.news_articles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_ar TEXT NOT NULL,
    title_en TEXT,
    content_ar TEXT,
    content_en TEXT,
    category TEXT CHECK (category IN ('climate_health','research','opportunities','events')),
    cover_image TEXT,
    author_name TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
    teaser_permission_key TEXT DEFAULT 'view:public_content' REFERENCES public.permissions(perm_key) ON DELETE SET DEFAULT,
    full_access_permission_key TEXT DEFAULT 'view:free_content' REFERENCES public.permissions(perm_key) ON DELETE SET DEFAULT,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Certificates (restricted insert, only cert issuers or the matching student can insert)
CREATE TABLE IF NOT EXISTS public.certificates (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    course TEXT NOT NULL,
    email TEXT NOT NULL,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Applications table defined above near its trigger

-- ------------------------------------------------------------
-- 6. Enable Row Level Security (RLS)
-- ------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------
-- 7. RLS Policies
-- ------------------------------------------------------------

-- Drop existing policies if they exist to prevent duplicate/already exists errors
DROP POLICY IF EXISTS "Allow public read on roles" ON public.roles;
DROP POLICY IF EXISTS "Allow public read on permissions" ON public.permissions;
DROP POLICY IF EXISTS "Allow public read on role_permissions" ON public.role_permissions;
DROP POLICY IF EXISTS "Allow public read on user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Allow read own user_permissions" ON public.user_permissions;
DROP POLICY IF EXISTS "Allow public read access on profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow profile updates for owner" ON public.profiles;
DROP POLICY IF EXISTS "Allow read courses" ON public.courses;
DROP POLICY IF EXISTS "Insert Own Course" ON public.courses;
DROP POLICY IF EXISTS "Update Own Course" ON public.courses;
DROP POLICY IF EXISTS "Delete Own Course" ON public.courses;
DROP POLICY IF EXISTS "Manage Any Course" ON public.courses;
DROP POLICY IF EXISTS "Allow public read of modules" ON public.modules;
DROP POLICY IF EXISTS "Insert Own Module" ON public.modules;
DROP POLICY IF EXISTS "Update Own Module" ON public.modules;
DROP POLICY IF EXISTS "Delete Own Module" ON public.modules;
DROP POLICY IF EXISTS "Allow read lessons for course subscribers" ON public.lessons;
DROP POLICY IF EXISTS "Insert Own Lesson" ON public.lessons;
DROP POLICY IF EXISTS "Update Own Lesson" ON public.lessons;
DROP POLICY IF EXISTS "Delete Own Lesson" ON public.lessons;
DROP POLICY IF EXISTS "Allow read publications" ON public.publications;
DROP POLICY IF EXISTS "Insert Own Publication" ON public.publications;
DROP POLICY IF EXISTS "Update Own Publication" ON public.publications;
DROP POLICY IF EXISTS "Delete Own Publication" ON public.publications;
DROP POLICY IF EXISTS "Allow read news articles" ON public.news_articles;
DROP POLICY IF EXISTS "Insert Own Article" ON public.news_articles;
DROP POLICY IF EXISTS "Update Own Article" ON public.news_articles;
DROP POLICY IF EXISTS "Delete Own Article" ON public.news_articles;
DROP POLICY IF EXISTS "Allow read opportunities" ON public.opportunities;
DROP POLICY IF EXISTS "Insert Own Opportunity" ON public.opportunities;
DROP POLICY IF EXISTS "Update Own Opportunity" ON public.opportunities;
DROP POLICY IF EXISTS "Delete Own Opportunity" ON public.opportunities;
DROP POLICY IF EXISTS "Allow read events" ON public.events;
DROP POLICY IF EXISTS "Insert Own Event" ON public.events;
DROP POLICY IF EXISTS "Update Own Event" ON public.events;
DROP POLICY IF EXISTS "Delete Own Event" ON public.events;
DROP POLICY IF EXISTS "Allow public read own applications" ON public.applications;
DROP POLICY IF EXISTS "Insert Own Application" ON public.applications;
DROP POLICY IF EXISTS "Approve Applications" ON public.applications;
DROP POLICY IF EXISTS "Public Read Certificates" ON public.certificates;
DROP POLICY IF EXISTS "Issue certificates" ON public.certificates;
DROP POLICY IF EXISTS "Revoke Certificates" ON public.certificates;
DROP POLICY IF EXISTS "Allow read own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Allow self enrollment" ON public.enrollments;
DROP POLICY IF EXISTS "Allow update own enrollment" ON public.enrollments;
DROP POLICY IF EXISTS "Allow read own completions" ON public.lesson_completions;
DROP POLICY IF EXISTS "Allow insert own completions" ON public.lesson_completions;
DROP POLICY IF EXISTS "Allow delete own completions" ON public.lesson_completions;
DROP POLICY IF EXISTS "Allow read quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Manage quizzes" ON public.quizzes;
DROP POLICY IF EXISTS "Allow read questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Manage questions" ON public.quiz_questions;
DROP POLICY IF EXISTS "Allow read options" ON public.quiz_options;
DROP POLICY IF EXISTS "Manage options" ON public.quiz_options;
DROP POLICY IF EXISTS "Allow read own attempts" ON public.quiz_attempts;

-- Roles & Permissions (Public Read)
CREATE POLICY "Allow public read on roles" ON public.roles FOR SELECT USING (true);
CREATE POLICY "Allow public read on permissions" ON public.permissions FOR SELECT USING (true);
CREATE POLICY "Allow public read on role_permissions" ON public.role_permissions FOR SELECT USING (true);
CREATE POLICY "Allow public read on user_roles" ON public.user_roles FOR SELECT USING (true);

-- User permissions (Fixed recursive policy by avoiding has_permission function)
CREATE POLICY "Allow read own user_permissions" ON public.user_permissions FOR SELECT USING (
    auth.uid() = user_id 
    OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid() AND r.role_name IN ('admin', 'superadmin')
    )
);

-- Profiles
CREATE POLICY "Allow public read access on profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Allow profile updates for owner" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Courses (Fixed public select logic based on teaser/full access permissions)
CREATE POLICY "Allow read courses" ON public.courses FOR SELECT USING (
    public.has_permission(auth.uid(), teaser_permission_key)
    OR public.has_permission(auth.uid(), full_access_permission_key)
    OR created_by = auth.uid()
);
CREATE POLICY "Insert Own Course" ON public.courses FOR INSERT WITH CHECK (
    public.has_permission(auth.uid(),'write:courses') AND (created_by IS NULL OR created_by = auth.uid())
);
CREATE POLICY "Update Own Course" ON public.courses FOR UPDATE USING (
    auth.uid() = created_by AND public.has_permission(auth.uid(),'write:courses')
);
CREATE POLICY "Delete Own Course" ON public.courses FOR DELETE USING (
    auth.uid() = created_by AND public.has_permission(auth.uid(),'write:courses')
);
CREATE POLICY "Manage Any Course" ON public.courses FOR ALL USING (
    public.has_permission(auth.uid(),'manage:any_course')
);

-- Modules
CREATE POLICY "Allow public read of modules" ON public.modules FOR SELECT USING (true);
CREATE POLICY "Insert Own Module" ON public.modules FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_id
          AND (c.created_by = auth.uid() OR public.has_permission(auth.uid(), 'manage:any_course'))
    )
);
CREATE POLICY "Update Own Module" ON public.modules FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_id
          AND (c.created_by = auth.uid() OR public.has_permission(auth.uid(), 'manage:any_course'))
    )
);
CREATE POLICY "Delete Own Module" ON public.modules FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_id
          AND (c.created_by = auth.uid() OR public.has_permission(auth.uid(), 'manage:any_course'))
    )
);

-- Lessons
CREATE POLICY "Allow read lessons for course subscribers" ON public.lessons FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.modules m
        JOIN public.courses c ON m.course_id = c.id
        WHERE m.id = lessons.module_id
          AND (
              public.has_permission(auth.uid(), c.full_access_permission_key)
              OR c.created_by = auth.uid()
              OR public.has_permission(auth.uid(), 'manage:any_course')
          )
    )
);
CREATE POLICY "Insert Own Lesson" ON public.lessons FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.modules m
        JOIN public.courses c ON m.course_id = c.id
        WHERE m.id = lessons.module_id
          AND (c.created_by = auth.uid() OR public.has_permission(auth.uid(), 'manage:any_course'))
    )
    AND (created_by IS NULL OR created_by = auth.uid())
);
CREATE POLICY "Update Own Lesson" ON public.lessons FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.modules m
        JOIN public.courses c ON m.course_id = c.id
        WHERE m.id = lessons.module_id
          AND (c.created_by = auth.uid() OR public.has_permission(auth.uid(), 'manage:any_course'))
    )
);
CREATE POLICY "Delete Own Lesson" ON public.lessons FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.modules m
        JOIN public.courses c ON m.course_id = c.id
        WHERE m.id = lessons.module_id
          AND (c.created_by = auth.uid() OR public.has_permission(auth.uid(), 'manage:any_course'))
    )
);

-- Publications (Fixed RLS R/W permissions)
CREATE POLICY "Allow read publications" ON public.publications FOR SELECT USING (
    public.has_permission(auth.uid(), full_access_permission_key)
    OR created_by = auth.uid()
    OR public.has_permission(auth.uid(), 'manage:any_publication')
);
CREATE POLICY "Insert Own Publication" ON public.publications FOR INSERT WITH CHECK (
    public.has_permission(auth.uid(),'write:research') AND (created_by IS NULL OR created_by = auth.uid())
);
CREATE POLICY "Update Own Publication" ON public.publications FOR UPDATE USING (
    auth.uid() = created_by OR public.has_permission(auth.uid(),'manage:any_publication')
);
CREATE POLICY "Delete Own Publication" ON public.publications FOR DELETE USING (
    auth.uid() = created_by OR public.has_permission(auth.uid(),'manage:any_publication')
);

-- News articles (Fixed RLS R/W permissions)
CREATE POLICY "Allow read news articles" ON public.news_articles FOR SELECT USING (
    public.has_permission(auth.uid(), full_access_permission_key)
    OR created_by = auth.uid()
    OR public.has_permission(auth.uid(), 'manage:any_article')
);
CREATE POLICY "Insert Own Article" ON public.news_articles FOR INSERT WITH CHECK (
    public.has_permission(auth.uid(),'write:articles') AND (created_by IS NULL OR created_by = auth.uid())
);
CREATE POLICY "Update Own Article" ON public.news_articles FOR UPDATE USING (
    auth.uid() = created_by OR public.has_permission(auth.uid(),'manage:any_article')
);
CREATE POLICY "Delete Own Article" ON public.news_articles FOR DELETE USING (
    auth.uid() = created_by OR public.has_permission(auth.uid(),'manage:any_article')
);

-- Opportunities (Fixed RLS R/W permissions)
CREATE POLICY "Allow read opportunities" ON public.opportunities FOR SELECT USING (
    public.has_permission(auth.uid(), full_access_permission_key)
    OR created_by = auth.uid()
    OR public.has_permission(auth.uid(), 'manage:any_opportunity')
);
CREATE POLICY "Insert Own Opportunity" ON public.opportunities FOR INSERT WITH CHECK (
    public.has_permission(auth.uid(),'write:opportunities') AND (created_by IS NULL OR created_by = auth.uid())
);
CREATE POLICY "Update Own Opportunity" ON public.opportunities FOR UPDATE USING (
    auth.uid() = created_by OR public.has_permission(auth.uid(),'manage:any_opportunity')
);
CREATE POLICY "Delete Own Opportunity" ON public.opportunities FOR DELETE USING (
    auth.uid() = created_by OR public.has_permission(auth.uid(),'manage:any_opportunity')
);

-- Events (Fixed RLS R/W permissions)
CREATE POLICY "Allow read events" ON public.events FOR SELECT USING (
    public.has_permission(auth.uid(), teaser_permission_key)
    OR public.has_permission(auth.uid(), full_access_permission_key)
    OR created_by = auth.uid()
);
CREATE POLICY "Insert Own Event" ON public.events FOR INSERT WITH CHECK (
    public.has_permission(auth.uid(),'write:events') AND (created_by IS NULL OR created_by = auth.uid())
);
CREATE POLICY "Update Own Event" ON public.events FOR UPDATE USING (
    auth.uid() = created_by OR public.has_permission(auth.uid(),'manage:any_event')
);
CREATE POLICY "Delete Own Event" ON public.events FOR DELETE USING (
    auth.uid() = created_by OR public.has_permission(auth.uid(),'manage:any_event')
);

-- Applications – only admins (approve:users) can update status
CREATE POLICY "Allow public read own applications" ON public.applications FOR SELECT USING (
    auth.uid() = user_id OR public.has_permission(auth.uid(), 'approve:users')
);
CREATE POLICY "Insert Own Application" ON public.applications FOR INSERT WITH CHECK (
    auth.uid() = user_id AND public.has_permission(auth.uid(), 'apply:specialized_roles')
);
CREATE POLICY "Approve Applications" ON public.applications FOR UPDATE USING (
    public.has_permission(auth.uid(),'approve:users')
);

-- Certificates (Hardened from Public Insert to owner/issuer only)
CREATE POLICY "Public Read Certificates" ON public.certificates FOR SELECT USING (true);
CREATE POLICY "Issue certificates" ON public.certificates FOR INSERT WITH CHECK (
    public.has_permission(auth.uid(), 'issue:certs')
);
CREATE POLICY "Revoke Certificates" ON public.certificates FOR DELETE USING (
    public.has_permission(auth.uid(),'issue:certs')
);

-- Enrollments RLS Policies
CREATE POLICY "Allow read own enrollments" ON public.enrollments FOR SELECT USING (
    auth.uid() = user_id OR public.has_permission(auth.uid(), 'approve:users')
);
CREATE POLICY "Allow self enrollment" ON public.enrollments FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_id
          AND (
              public.has_permission(auth.uid(), c.full_access_permission_key)
              OR c.created_by = auth.uid()
              OR public.has_permission(auth.uid(), 'manage:any_course')
          )
    )
);
CREATE POLICY "Allow update own enrollment" ON public.enrollments FOR UPDATE USING (
    auth.uid() = user_id OR public.has_permission(auth.uid(), 'approve:users')
) WITH CHECK (
    (auth.uid() = user_id AND status IS DISTINCT FROM 'completed')
    OR public.has_permission(auth.uid(), 'approve:users')
);

-- Lesson Completions RLS Policies
CREATE POLICY "Allow read own completions" ON public.lesson_completions FOR SELECT USING (
    auth.uid() = user_id OR public.has_permission(auth.uid(), 'approve:users')
);
CREATE POLICY "Allow insert own completions" ON public.lesson_completions FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
        SELECT 1 FROM public.lessons l
        JOIN public.modules m ON l.module_id = m.id
        JOIN public.enrollments e ON m.course_id = e.course_id
        WHERE l.id = lesson_id AND e.user_id = auth.uid() AND e.status = 'active'
    )
);
CREATE POLICY "Allow delete own completions" ON public.lesson_completions FOR DELETE USING (
    auth.uid() = user_id
);

-- Quizzes RLS Policies
CREATE POLICY "Allow read quizzes" ON public.quizzes FOR SELECT USING (true);
CREATE POLICY "Manage quizzes" ON public.quizzes FOR ALL USING (
    public.has_permission(auth.uid(), 'manage:any_course')
    OR EXISTS (
        SELECT 1 FROM public.courses c
        WHERE c.id = course_id
          AND c.created_by = auth.uid()
          AND public.has_permission(auth.uid(), 'write:courses')
    )
);

-- Quiz Questions RLS Policies
CREATE POLICY "Allow read questions" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Manage questions" ON public.quiz_questions FOR ALL USING (
    public.has_permission(auth.uid(), 'manage:any_course')
    OR EXISTS (
        SELECT 1 FROM public.quizzes q
        JOIN public.courses c ON q.course_id = c.id
        WHERE q.id = quiz_id
          AND c.created_by = auth.uid()
          AND public.has_permission(auth.uid(), 'write:courses')
    )
);

-- Quiz Options RLS Policies
CREATE POLICY "Allow read options" ON public.quiz_options FOR SELECT USING (
    public.has_permission(auth.uid(), 'manage:any_course')
);
CREATE POLICY "Manage options" ON public.quiz_options FOR ALL USING (
    public.has_permission(auth.uid(), 'manage:any_course')
    OR EXISTS (
        SELECT 1 FROM public.quiz_questions qq
        JOIN public.quizzes q ON qq.quiz_id = q.id
        JOIN public.courses c ON q.course_id = c.id
        WHERE qq.id = question_id
          AND c.created_by = auth.uid()
          AND public.has_permission(auth.uid(), 'write:courses')
    )
);

-- Quiz Attempts RLS Policies
CREATE POLICY "Allow read own attempts" ON public.quiz_attempts FOR SELECT USING (
    auth.uid() = user_id OR public.has_permission(auth.uid(), 'approve:users')
);

-- ------------------------------------------------------------
-- 8. Seed roles, permissions, role‑permission mappings
-- ------------------------------------------------------------
INSERT INTO public.roles (role_name, description) VALUES
('user','Unpaid Signed User – free content'),
('subscriber','Paid Signed User – all courses & articles'),
('researcher','Can create & publish research'),
('educator','Can host community lectures'),
('admin','Moderation & content management'),
('superadmin','Full system control')
ON CONFLICT (role_name) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO public.permissions (perm_key, description) VALUES
('view:public_content','Baseline public access – teasers for everyone'),
('view:free_content','Signed‑in user free content'),
('view:all_courses','Subscriber can view all courses'),
('view:all_articles','Subscriber can view all articles'),
('view:all_research','Subscriber can view all research'),
('apply:specialized_roles','Can apply for researcher/educator'),
('write:courses','Create own courses'),
('manage:any_course','Edit/delete any course'),
('write:research','Create own research publications'),
('manage:any_publication','Edit/delete any publication'),
('write:articles','Create own news articles'),
('manage:any_article','Edit/delete any article'),
('write:opportunities','Create own opportunities'),
('manage:any_opportunity','Edit/delete any opportunity'),
('write:events','Create own events'),
('manage:any_event','Edit/delete any event'),
('approve:users','Approve researcher/educator applications'),
('issue:certs','Issue & revoke certificates'),
('review:posts','Moderate user‑generated posts'),
('manage:system','Configure system settings')
ON CONFLICT (perm_key) DO UPDATE SET description = EXCLUDED.description;

DO $$
DECLARE role_id UUID;
BEGIN
    -- USER role
    SELECT id INTO role_id FROM public.roles WHERE role_name='user';
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT role_id, id FROM public.permissions WHERE perm_key IN ('view:free_content','apply:specialized_roles')
    ON CONFLICT DO NOTHING;

    -- SUBSCRIBER role
    SELECT id INTO role_id FROM public.roles WHERE role_name='subscriber';
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT role_id, id FROM public.permissions WHERE perm_key IN ('view:free_content','view:all_courses','view:all_articles','view:all_research','apply:specialized_roles')
    ON CONFLICT DO NOTHING;

    -- RESEARCHER role (Can write own research, articles, and courses; NO global admin overrides)
    SELECT id INTO role_id FROM public.roles WHERE role_name='researcher';
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT role_id, id FROM public.permissions WHERE perm_key IN (
        'view:free_content','view:all_courses','view:all_articles','view:all_research',
        'write:research','write:courses','write:articles'
    )
    ON CONFLICT DO NOTHING;

    -- EDUCATOR role (Can write own events/lectures, articles; NO global admin overrides)
    SELECT id INTO role_id FROM public.roles WHERE role_name='educator';
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT role_id, id FROM public.permissions WHERE perm_key IN (
        'view:free_content','view:all_courses','view:all_articles','view:all_research',
        'write:events','write:articles'
    )
    ON CONFLICT DO NOTHING;

    -- ADMIN role (Can manage any content, approve users, issue certs)
    SELECT id INTO role_id FROM public.roles WHERE role_name='admin';
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT role_id, id FROM public.permissions WHERE perm_key IN (
        'view:free_content','view:all_courses','view:all_articles','view:all_research',
        'write:articles','manage:any_course','manage:any_article','manage:any_publication',
        'approve:users','issue:certs','review:posts','write:opportunities','manage:any_opportunity',
        'write:events','manage:any_event','write:courses'
    )
    ON CONFLICT DO NOTHING;

    -- SUPERADMIN role (all permissions)
    SELECT id INTO role_id FROM public.roles WHERE role_name='superadmin';
    INSERT INTO public.role_permissions (role_id, permission_id)
    SELECT role_id, id FROM public.permissions
    ON CONFLICT DO NOTHING;
END $$;

-- ------------------------------------------------------------
-- 9. Indexes for fast permission checks & queries
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_perms_user ON public.user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_courses_teaser_perm ON public.courses(teaser_permission_key);
CREATE INDEX IF NOT EXISTS idx_courses_full_perm ON public.courses(full_access_permission_key);
CREATE INDEX IF NOT EXISTS idx_articles_teaser_perm ON public.news_articles(teaser_permission_key);
CREATE INDEX IF NOT EXISTS idx_articles_full_perm ON public.news_articles(full_access_permission_key);
CREATE INDEX IF NOT EXISTS idx_publications_teaser_perm ON public.publications(teaser_permission_key);
CREATE INDEX IF NOT EXISTS idx_publications_full_perm ON public.publications(full_access_permission_key);
CREATE INDEX IF NOT EXISTS idx_opps_teaser_perm ON public.opportunities(teaser_permission_key);
CREATE INDEX IF NOT EXISTS idx_opps_full_perm ON public.opportunities(full_access_permission_key);
CREATE INDEX IF NOT EXISTS idx_events_teaser_perm ON public.events(teaser_permission_key);
CREATE INDEX IF NOT EXISTS idx_events_full_perm ON public.events(full_access_permission_key);

-- LMS indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_user ON public.lesson_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_completions_lesson ON public.lesson_completions(lesson_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON public.quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);

-- ------------------------------------------------------------
-- 10. Dynamic column masking views for secure frontend queries
-- ------------------------------------------------------------

-- Publications with PDF and external link masking
CREATE OR REPLACE VIEW public.publications_accessible AS
SELECT 
    id, title_ar, title_en, authors, abstract_ar, abstract_en, category, year, 
    teaser_permission_key, full_access_permission_key, created_by, created_at,
    CASE 
        WHEN public.has_permission(auth.uid(), full_access_permission_key) OR created_by = auth.uid() 
        THEN pdf_url 
        ELSE NULL 
    END AS pdf_url,
    CASE 
        WHEN public.has_permission(auth.uid(), full_access_permission_key) OR created_by = auth.uid() 
        THEN external_link 
        ELSE NULL 
    END AS external_link
FROM public.publications
WHERE public.has_permission(auth.uid(), teaser_permission_key) 
   OR public.has_permission(auth.uid(), full_access_permission_key)
   OR created_by = auth.uid();

-- News articles with body content masking
CREATE OR REPLACE VIEW public.news_articles_accessible AS
SELECT 
    id, title_ar, title_en, category, cover_image, author_name, published_at,
    teaser_permission_key, full_access_permission_key, created_by,
    CASE 
        WHEN public.has_permission(auth.uid(), full_access_permission_key) OR created_by = auth.uid() 
        THEN content_ar 
        ELSE NULL 
    END AS content_ar,
    CASE 
        WHEN public.has_permission(auth.uid(), full_access_permission_key) OR created_by = auth.uid() 
        THEN content_en 
        ELSE NULL 
    END AS content_en
FROM public.news_articles
WHERE public.has_permission(auth.uid(), teaser_permission_key) 
   OR public.has_permission(auth.uid(), full_access_permission_key)
   OR created_by = auth.uid();

-- Opportunities with application link masking
CREATE OR REPLACE VIEW public.opportunities_accessible AS
SELECT 
    id, title_ar, title_en, type, description_ar, description_en, eligibility_ar, eligibility_en, deadline, created_at,
    teaser_permission_key, full_access_permission_key, created_by,
    CASE 
        WHEN public.has_permission(auth.uid(), full_access_permission_key) OR created_by = auth.uid() 
        THEN apply_link 
        ELSE NULL 
    END AS apply_link
FROM public.opportunities
WHERE public.has_permission(auth.uid(), teaser_permission_key) 
   OR public.has_permission(auth.uid(), full_access_permission_key)
   OR created_by = auth.uid();

-- Grant access to public views
GRANT SELECT ON public.publications_accessible TO anon, authenticated;
GRANT SELECT ON public.news_articles_accessible TO anon, authenticated;
GRANT SELECT ON public.opportunities_accessible TO anon, authenticated;
GRANT SELECT ON public.quiz_options_accessible TO anon, authenticated;

-- ------------------------------------------------------------
-- 11. Join Requests
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.join_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    profession TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.join_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert join requests" ON public.join_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert join requests" ON public.join_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow admin view join requests" ON public.join_requests FOR SELECT USING (
    public.has_permission(auth.uid(), 'approve:users')
);

-- Add cv_url column to join_requests
ALTER TABLE public.join_requests ADD COLUMN IF NOT EXISTS cv_url TEXT;

-- Add new fields for expanded join request form
ALTER TABLE public.join_requests ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.join_requests ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.join_requests ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.join_requests ADD COLUMN IF NOT EXISTS university_org TEXT;
ALTER TABLE public.join_requests ADD COLUMN IF NOT EXISTS work TEXT;
ALTER TABLE public.join_requests ADD COLUMN IF NOT EXISTS is_activist BOOLEAN DEFAULT false;
ALTER TABLE public.join_requests ADD COLUMN IF NOT EXISTS activist_field TEXT;
ALTER TABLE public.join_requests ADD COLUMN IF NOT EXISTS bio TEXT;


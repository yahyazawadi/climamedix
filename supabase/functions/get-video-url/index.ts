import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { AwsClient } from 'https://esm.sh/aws4fetch@1.0.19';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Parse the request body
    const { lessonId, courseId } = await req.json();
    if (!lessonId || !courseId) {
      return new Response(JSON.stringify({ error: 'lessonId and courseId are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Verify the user is enrolled in the course (server-side check)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: enrollment, error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('course_id', courseId)
      .eq('status', 'active')
      .maybeSingle();

    // Also allow admins/superadmins with manage:any_course permission
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || profile?.role === 'superadmin';

    if (!enrollment && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Not enrolled in this course' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Get the lesson's video_url (the R2 object key)
    const { data: lesson, error: lessonError } = await supabaseAdmin
      .from('lessons')
      .select('video_url')
      .eq('id', lessonId)
      .single();

    if (lessonError || !lesson?.video_url) {
      return new Response(JSON.stringify({ error: 'Lesson video not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 5. Generate a presigned URL using AWS4 signature (R2 is S3-compatible)
    const r2 = new AwsClient({
      accessKeyId: Deno.env.get('R2_ACCESS_KEY_ID') ?? '',
      secretAccessKey: Deno.env.get('R2_SECRET_ACCESS_KEY') ?? '',
      service: 's3',
      region: 'auto',
    });

    const bucketName = Deno.env.get('R2_BUCKET_NAME') ?? 'climamedix';
    const r2Endpoint = Deno.env.get('R2_ENDPOINT') ?? '';

    // Extract just the key from the video_url (strip any base URL if present)
    const videoKey = lesson.video_url.startsWith('http')
      ? new URL(lesson.video_url).pathname.slice(1)
      : lesson.video_url;

    const objectUrl = `${r2Endpoint}/${bucketName}/${videoKey}`;

    // Presigned URL valid for 2 hours
    const expiresIn = 7200;
    const presignedRequest = await r2.sign(
      new Request(objectUrl, { method: 'GET' }),
      {
        aws: {
          signQuery: true,
          expiresIn,
        },
      }
    );

    return new Response(
      JSON.stringify({ url: presignedRequest.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('get-video-url error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

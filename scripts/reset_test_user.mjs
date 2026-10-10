import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read from .env if present
let serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
let supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://wzytekdfbjlbtvsbxuyi.supabase.co';

if (!serviceKey) {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      const match = content.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/) || content.match(/VITE_SUPABASE_SERVICE_ROLE_KEY=(.*)/);
      if (match) serviceKey = match[1].trim();
    }
  } catch (e) {}
}

if (!serviceKey) {
  console.error('❌ Please set SUPABASE_SERVICE_ROLE_KEY in .env or environment variable.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const targetEmail = process.argv[2] || 'yahyazawadi278@gmail.com';

async function resetUserData(email) {
  console.log(`\n=== Resetting LMS Data for: ${email} ===`);

  // 1. Find user profile ID
  const { data: users, error: userErr } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .ilike('email', `%${email}%`);

  if (userErr || !users || users.length === 0) {
    console.error('❌ User not found:', userErr || 'No matching profile');
    return;
  }

  const user = users[0];
  console.log(`✓ Found user: ${user.full_name || 'No name'} (${user.email}) -> ID: ${user.id}`);

  // 2. Clear all LMS tables
  const tables = ['lesson_completions', 'enrollments', 'quiz_attempts', 'certificate_requests'];

  for (const table of tables) {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('user_id', user.id);

    if (error) {
      console.error(`❌ Error clearing ${table}:`, error.message);
    } else {
      console.log(`✓ Cleared ${table}`);
    }
  }

  console.log(`\n🎉 User ${email} is now completely fresh and un-enrolled!\n`);
}

resetUserData(targetEmail);

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const s = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Try inserting with a test category to see allowed values
const { data, error } = await s.from('publications').insert({ title_ar: 'test', category: 'test_invalid_123' }).select();
if (error) {
  console.log('Error message:', error.message);
  console.log('Details:', error.details);
  console.log('Hint:', error.hint);
}

// Also check the table structure
const { data: cols, error: colErr } = await s.from('publications').select('*').limit(0);
console.log('Table accessible:', !colErr);

import { supabase } from '../../../utils/supabaseClient';

export async function fetchOpportunities() {
  const { data, error } = await supabase
    .from('opportunities_accessible')
    .select('*')
    .order('deadline', { ascending: true });

  if (error) {
    console.error('Error fetching opportunities:', error);
    throw error;
  }
  return data;
}

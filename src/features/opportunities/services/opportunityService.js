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

export async function createOpportunity(opportunityData) {
  const { data, error } = await supabase
    .from('opportunities')
    .insert([opportunityData])
    .select();

  if (error) {
    console.error('Error creating opportunity:', error);
    throw error;
  }
  return data[0];
}

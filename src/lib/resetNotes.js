import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function resetNotes() {
  const { error } = await supabase
    .from('project_2025_notes')
    .delete()
    .neq('note_id', 0);
    
  if (error) {
    console.error('Error truncating notes:', error);
    process.exit(1);
  }
  
  console.log('Notes table emptied successfully');
  process.exit(0);
}
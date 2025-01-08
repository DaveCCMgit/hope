import { supabase } from './supabase';

export async function resetNotes() {
  const { error } = await supabase
    .from('project_2025_notes')
    .delete()
    .neq('note_id', 0); // Delete all records
    
  if (error) {
    console.error('Error truncating notes:', error);
    throw error;
  }
  
  console.log('Notes table emptied successfully');
}
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Note {
  note_id: number;
  note: string;
  created_at: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  milestone: {
    milestone_id: number;
    description: string;
  } | null;
  notes: Note[];
  onAddNote: (note: string) => void;
}

export default function MilestoneModal({ isOpen, onClose, milestone, notes, onAddNote }: Props) {
  const [newNote, setNewNote] = useState('');

  if (!isOpen || !milestone) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      onAddNote(newNote.trim());
      setNewNote('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

        <div className="relative inline-block w-full max-w-lg p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {milestone.description}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mb-6">
            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a new note..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
              <button
                type="submit"
                className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Add Note
              </button>
            </form>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-500">Notes</h4>
            {notes.length === 0 ? (
              <p className="text-sm text-gray-500">No notes yet</p>
            ) : (
              <div className="space-y-3">
                {notes.map((note) => (
                  <div
                    key={note.note_id}
                    className="p-3 bg-gray-50 rounded-md"
                  >
                    <p className="text-sm text-gray-600">{note.note}</p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(note.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
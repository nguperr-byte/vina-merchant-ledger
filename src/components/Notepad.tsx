import React, { useState } from 'react';
import { Plus, Trash2, Calendar, FileText, Edit2, AlertCircle } from 'lucide-react';
import { Note } from '../types';

interface NotepadProps {
  notes: Note[];
  onAddNote: (note: Omit<Note, 'id' | 'date'>) => void;
  onEditNote: (note: Note) => void;
  onDeleteNote: (id: string) => void;
}

export default function Notepad({
  notes,
  onAddNote,
  onEditNote,
  onDeleteNote,
}: NotepadProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteToDeleteId, setNoteToDeleteId] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;

    if (editingNoteId) {
      onEditNote({
        id: editingNoteId,
        title,
        text,
        date: new Date().toISOString()
      });
      setEditingNoteId(null);
    } else {
      onAddNote({ title, text });
      setShowAddForm(false);
    }

    setTitle('');
    setText('');
  };

  const startEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setTitle(note.title);
    setText(note.text);
    setShowAddForm(false);
  };

  return (
    <div id="notepad-view" className="space-y-6">
      
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight font-sans">Business Diary & Notepad</h1>
          <p className="text-slate-500 text-xs mt-0.5">Jot down supplier updates, phone notes, or quick reminders.</p>
        </div>

        {!showAddForm && !editingNoteId && (
          <button
            id="add-note-trigger-btn"
            onClick={() => {
              setTitle('');
              setText('');
              setShowAddForm(true);
            }}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Note</span>
          </button>
        )}
      </div>

      {/* Form Area */}
      {(showAddForm || editingNoteId) && (
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
              {editingNoteId ? 'Edit Notepad Entry' : 'Create Notepad Entry'}
            </h2>
            <button
              onClick={() => {
                setShowAddForm(false);
                setEditingNoteId(null);
              }}
              className="text-slate-400 hover:text-slate-600 font-bold text-xs"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-semibold">
            <div>
              <label className="block text-slate-500 mb-1">Title / Topic *</label>
              <input
                id="note-form-title"
                type="text"
                required
                placeholder="e.g. Supplier Price Increase, Call Musa"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-500 mb-1">Entry Text *</label>
              <textarea
                id="note-form-text"
                required
                placeholder="Write your note description here..."
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-800 focus:outline-none resize-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition shadow"
            >
              {editingNoteId ? 'Save Note Changes' : 'Save Note'}
            </button>
          </form>
        </div>
      )}

      {/* Notes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {notes.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl py-12 text-center border border-slate-100 shadow-sm">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <h3 className="text-slate-700 font-bold text-sm">No notes saved</h3>
            <p className="text-slate-400 text-xs mt-1">Keep track of business reminders by adding notes above.</p>
          </div>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              id={`note-card-${note.id}`}
              className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between gap-4 group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center text-amber-600">
                      <FileText className="w-4 h-4" />
                    </div>
                    <h3 className="font-extrabold text-slate-950 text-sm tracking-tight">{note.title}</h3>
                  </div>

                  <div className="flex items-center gap-1 opacity-60 group-hover:opacity-100 transition">
                    <button
                      id={`edit-note-btn-${note.id}`}
                      onClick={() => startEdit(note)}
                      className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-indigo-600 cursor-pointer transition"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    
                    <button
                      id={`delete-note-btn-${note.id}`}
                      onClick={() => setNoteToDeleteId(note.id)}
                      className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-500 cursor-pointer transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-slate-600 text-xs font-medium leading-relaxed whitespace-pre-wrap">{note.text}</p>
              </div>

              <div className="pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Last Updated:</span>
                </span>
                <span>
                  {new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      {noteToDeleteId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 border border-slate-100 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="font-extrabold text-sm text-slate-900">Delete Notepad Entry?</h3>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Are you sure you want to delete <strong>{notes.find(n => n.id === noteToDeleteId)?.title || 'this note'}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setNoteToDeleteId(null)}
                className="flex-1 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteNote(noteToDeleteId);
                  setNoteToDeleteId(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-sm"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

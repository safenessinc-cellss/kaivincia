import React, { useState } from 'react';
import { X, FileText, Send, User, Clock, Tag } from 'lucide-react';
import { LeadOpportunity, LeadNote } from '../../types/crm';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  client: LeadOpportunity | null;
  onAddNote: (clientId: string, noteText: string) => Promise<void>;
  currentUserName: string;
}

export default function LeadNotesModal({ isOpen, onClose, client, onAddNote, currentUserName }: Props) {
  const [noteText, setNoteText] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !client) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    setLoading(true);
    try {
      await onAddNote(client.id, noteText.trim());
      setNoteText('');
    } catch (err) {
      console.error("Error adding note:", err);
    } finally {
      setLoading(false);
    }
  };

  const notesList = client.notes || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0D121D] border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Notas de la Tarjeta</h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {client.name} • {client.phone}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notes History */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 custom-scrollbar">
          {notesList.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Aún no hay notas registradas para este contacto.
            </div>
          ) : (
            notesList.map((note, idx) => (
              <div key={note.id || idx} className="p-3 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-bold text-white flex items-center gap-1">
                    <User className="w-3 h-3 text-cyan-400" /> {note.author || 'TLMK'}
                  </span>
                  <span className="font-mono text-slate-500 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {note.text}
                </p>
                {note.disposition && (
                  <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    Disposición: {note.disposition}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Add Note Form */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-800 bg-slate-900/40 shrink-0">
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder={`Escribir nota como ${currentUserName}...`}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#00F0FF]"
            />
            <button
              type="submit"
              disabled={loading || !noteText.trim()}
              className="px-4 py-2.5 bg-[#00F0FF] hover:bg-[#22D3EE] text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

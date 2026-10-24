import React, { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { Check, X, Clock, Mail, User as UserIcon, ShieldCheck } from 'lucide-react';

interface PendingUser {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  createdAt?: any;
  status?: string;
}

export default function PendingUsersPanel() {
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'users'), where('status', '==', 'pending'));
    const unsub = onSnapshot(q, (snap) => {
      setPending(snap.docs.map(d => ({ id: d.id, ...d.data() } as PendingUser)));
      setLoading(false);
    }, (err) => {
      console.warn('pending users query failed:', err.message);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const approve = async (uid: string) => {
    setBusy(uid);
    try {
      await updateDoc(doc(db, 'users', uid), {
        status: 'approved',
        approvedBy: auth.currentUser?.uid || null,
        approvedAt: serverTimestamp(),
      });
    } catch (err: any) {
      alert(`Error aprobando: ${err.message}`);
    } finally {
      setBusy(null);
    }
  };

  const reject = async (uid: string) => {
    const reason = prompt('Motivo del rechazo (opcional):') || '';
    setBusy(uid);
    try {
      await updateDoc(doc(db, 'users', uid), {
        status: 'rejected',
        rejectedBy: auth.currentUser?.uid || null,
        rejectedAt: serverTimestamp(),
        rejectionReason: reason,
      });
    } catch (err: any) {
      alert(`Error rechazando: ${err.message}`);
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm text-gray-500">Cargando solicitudes…</div>;
  }

  if (pending.length === 0) {
    return (
      <div className="p-6 bg-white border border-gray-200 rounded-lg">
        <div className="flex items-center gap-2 text-green-700 mb-2">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="font-semibold">Sin solicitudes pendientes</h3>
        </div>
        <p className="text-sm text-gray-500">No hay usuarios esperando aprobación.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          Solicitudes pendientes ({pending.length})
        </h3>
      </div>
      <ul className="divide-y divide-gray-200">
        {pending.map(u => (
          <li key={u.id} className="p-4 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <UserIcon className="w-4 h-4 text-gray-500" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-gray-900 truncate">{u.name || u.email || u.id}</div>
                <div className="text-xs text-gray-500 flex items-center gap-1 truncate">
                  <Mail className="w-3 h-3" /> {u.email || '—'}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => approve(u.id)}
                disabled={busy === u.id}
                className="px-3 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" /> Aprobar
              </button>
              <button
                onClick={() => reject(u.id)}
                disabled={busy === u.id}
                className="px-3 py-1.5 rounded-md bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" /> Rechazar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

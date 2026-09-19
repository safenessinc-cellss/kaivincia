import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  arrayUnion, 
  Timestamp 
} from 'firebase/firestore';
import { db, auth } from '../firebase';

export interface TicketMessage {
  senderId: string;
  senderEmail: string;
  text: string;
  createdAt: any;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userEmail: string;
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  assignedTo: string | null;
  assignedToEmail: string | null;
  createdAt: any;
  updatedAt: any;
  messages: TicketMessage[];
}

// Registro estructurado en audit_logs
async function logTicketAudit(
  action: 'TICKET_CREATED' | 'TICKET_REPLIED' | 'TICKET_STATUS_CHANGED' | 'TICKET_ASSIGNED' | 'TICKET_CLOSED',
  ticketId: string,
  details: Record<string, any>
) {
  try {
    const user = auth.currentUser;
    if (!user) return;
    await addDoc(collection(db, 'audit_logs'), {
      action,
      actorId: user.uid,
      actorEmail: user.email || 'unknown',
      ticketId,
      details,
      timestamp: serverTimestamp()
    });
  } catch (err) {
    console.error('Error registrando log de auditoría:', err);
  }
}

// 1. Crear nuevo ticket
export async function createTicket(data: {
  subject: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
}) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');

  const initialMessage: TicketMessage = {
    senderId: user.uid,
    senderEmail: user.email || 'desconocido',
    text: data.description,
    createdAt: Timestamp.now()
  };

  const docRef = await addDoc(collection(db, 'support_tickets'), {
    userId: user.uid,
    userEmail: user.email || 'desconocido',
    subject: data.subject.trim(),
    description: data.description.trim(),
    priority: data.priority,
    status: 'open',
    assignedTo: null,
    assignedToEmail: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    messages: [initialMessage]
  });

  await logTicketAudit('TICKET_CREATED', docRef.id, {
    subject: data.subject,
    priority: data.priority
  });

  return docRef.id;
}

// 2. Responder ticket
export async function replyTicket(ticketId: string, text: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('Usuario no autenticado');
  if (!text.trim()) return;

  const newMessage: TicketMessage = {
    senderId: user.uid,
    senderEmail: user.email || 'desconocido',
    text: text.trim(),
    createdAt: Timestamp.now()
  };

  const ticketRef = doc(db, 'support_tickets', ticketId);
  await updateDoc(ticketRef, {
    messages: arrayUnion(newMessage),
    updatedAt: serverTimestamp()
  });

  await logTicketAudit('TICKET_REPLIED', ticketId, {
    replyLength: text.length
  });
}

// 3. Cambiar estado
export async function changeTicketStatus(
  ticketId: string, 
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
) {
  const ticketRef = doc(db, 'support_tickets', ticketId);
  await updateDoc(ticketRef, {
    status,
    updatedAt: serverTimestamp()
  });

  await logTicketAudit('TICKET_STATUS_CHANGED', ticketId, { newStatus: status });
}

// 4. Asignar ticket (Admin/Gestor)
export async function assignTicket(
  ticketId: string, 
  uid: string | null, 
  email: string | null
) {
  const ticketRef = doc(db, 'support_tickets', ticketId);
  await updateDoc(ticketRef, {
    assignedTo: uid,
    assignedToEmail: email,
    updatedAt: serverTimestamp()
  });

  await logTicketAudit('TICKET_ASSIGNED', ticketId, {
    assignedTo: uid,
    assignedToEmail: email
  });
}

// 5. Cerrar ticket
export async function closeTicket(ticketId: string) {
  const ticketRef = doc(db, 'support_tickets', ticketId);
  await updateDoc(ticketRef, {
    status: 'closed',
    updatedAt: serverTimestamp()
  });

  await logTicketAudit('TICKET_CLOSED', ticketId, { finalStatus: 'closed' });
}

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { db } from '../firebase';
import { TelnyxSipCredential } from '../types/calls';
import { encryptData, decryptData, maskSensitiveKey } from '../utils/cryptoUtils';

/**
 * 9 Credenciales Reales SIP de Telnyx para Kaivincia Corp
 */
// Credentials previously embedded in this source were removed. Rotate them in Telnyx;
// never commit SIP passwords or provision production credentials from client code.
export const INITIAL_TELNYX_SIPS: Array<{
  name: string;
  connectionId: string;
  username: string;
  rawPassword: string;
  isDefault?: boolean;
}> = [];

export class SipCredentialsService {
  private static COLLECTION_NAME = 'telnyx_sip_credentials';

  /**
   * Obtener todas las credenciales SIP registradas en Firestore
   */
  public static async getAllSips(): Promise<TelnyxSipCredential[]> {
    try {
      const snap = await getDocs(collection(db, this.COLLECTION_NAME));
      if (snap.empty) {
        return [];
      }
      return snap.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as TelnyxSipCredential));
    } catch (error) {
      console.warn('Error fetching SIP credentials from Firestore:', error);
      return [];
    }
  }

  /**
   * Obtener la credencial SIP asignada a un agente por su UID
   */
  public static async getSipForAgent(agentUid: string): Promise<TelnyxSipCredential | null> {
    if (!agentUid) return null;
    try {
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('assignedTo', '==', agentUid),
        where('status', '==', 'active')
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docSnap = snap.docs[0];
        return {
          id: docSnap.id,
          ...docSnap.data()
        } as TelnyxSipCredential;
      }
      return null;
    } catch (error) {
      console.warn('Error fetching agent SIP credential:', error);
      return null;
    }
  }

  /**
   * Guardar o actualizar una credencial SIP con cifrado automático
   */
  public static async saveSipCredential(
    sipData: Partial<TelnyxSipCredential>,
    rawPassword?: string
  ): Promise<TelnyxSipCredential> {
    const docId = sipData.id || `sip_${sipData.connectionId || Date.now()}`;
    const docRef = doc(db, this.COLLECTION_NAME, docId);

    let passwordEncrypted = sipData.passwordEncrypted || '';
    if (rawPassword) {
      passwordEncrypted = await encryptData(rawPassword);
    }

    const payload: Partial<TelnyxSipCredential> = {
      name: sipData.name || 'SIP Connection',
      connectionId: sipData.connectionId || '',
      username: sipData.username || '',
      passwordEncrypted,
      passwordMasked: maskSensitiveKey(rawPassword || '••••••••', 2),
      assignedTo: sipData.assignedTo ?? null,
      assignedAgentName: sipData.assignedAgentName ?? null,
      assignedAgentEmail: sipData.assignedAgentEmail ?? null,
      status: sipData.status || 'active',
      sipDomain: sipData.sipDomain || 'sip.telnyx.com',
      sipPort: sipData.sipPort || 5060,
      transport: sipData.transport || 'WSS',
      isDefault: Boolean(sipData.isDefault),
      callerId: sipData.callerId || '+13055550199',
      updatedAt: new Date().toISOString()
    };

    if (!sipData.createdAt) {
      payload.createdAt = new Date().toISOString();
    }

    await setDoc(docRef, payload, { merge: true });

    return {
      id: docId,
      ...payload
    } as TelnyxSipCredential;
  }

  /**
   * Asignar un SIP a un agente/colaborador
   */
  public static async assignSipToAgent(
    sipId: string,
    agent: { uid: string; name: string; email: string } | null
  ): Promise<void> {
    const docRef = doc(db, this.COLLECTION_NAME, sipId);
    if (!agent) {
      await updateDoc(docRef, {
        assignedTo: null,
        assignedAgentName: null,
        assignedAgentEmail: null,
        updatedAt: new Date().toISOString()
      });
    } else {
      await updateDoc(docRef, {
        assignedTo: agent.uid,
        assignedAgentName: agent.name,
        assignedAgentEmail: agent.email,
        updatedAt: new Date().toISOString()
      });
    }
  }

  /**
   * Cambiar estado activo/inactivo de una credencial
   */
  public static async toggleStatus(sipId: string, currentStatus: 'active' | 'inactive'): Promise<'active' | 'inactive'> {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    const docRef = doc(db, this.COLLECTION_NAME, sipId);
    await updateDoc(docRef, {
      status: newStatus,
      updatedAt: new Date().toISOString()
    });
    return newStatus;
  }

  /**
   * Eliminar una credencial SIP
   */
  public static async deleteSip(sipId: string): Promise<void> {
    const docRef = doc(db, this.COLLECTION_NAME, sipId);
    await deleteDoc(docRef);
  }

  /**
   * Sembrar las 9 credenciales SIP iniciales si no existen
   */
  // No client-side credential seeding: credentials must be provisioned by
  // an authorized server-side workflow and never sourced from repository code.
  public static async seedInitialSips(_force = false): Promise<number> {
    return 0;
  }

  /**
   * Descifrar contraseña de un SIP de forma segura en cliente autorizado
   */
  public static async decryptSipPassword(encryptedStr: string): Promise<string> {
    if (!encryptedStr) return '';
    try {
      return await decryptData(encryptedStr);
    } catch (e) {
      console.warn('Error decrypting SIP password:', e);
      return '';
    }
  }
}

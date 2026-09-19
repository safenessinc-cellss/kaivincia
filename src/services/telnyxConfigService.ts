import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  addDoc, 
  collection 
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { encryptData, decryptData, maskSensitiveKey } from '../utils/cryptoUtils';

export interface TelnyxIntegrationConfig {
  id: 'telnyx';
  enabled: boolean;
  connectionId: string; // Encrypted with AES-GCM
  apiKey: string;       // Encrypted with AES-GCM
  availableNumbers: string[];
  lastTestedAt?: any;
  lastTestResult: 'success' | 'error' | 'untested';
  lastTestMessage?: string;
  configuredBy?: string;
  configuredByEmail?: string;
  configuredAt?: any;
  updatedAt?: any;
}

export interface TelnyxPublicStatus {
  id: 'telnyx';
  enabled: boolean;
  isConfigured: boolean;
  lastTestedAt?: any;
  lastTestResult: 'success' | 'error' | 'untested';
  lastTestMessage?: string;
  availableNumbers: string[];
  maskedConnectionId?: string;
  configuredByEmail?: string;
  updatedAt?: any;
}

const SETTINGS_COLLECTION = 'settings_integrations';
const TELNYX_DOC_ID = 'telnyx';

export class TelnyxConfigService {
  /**
   * Retrieves the Telnyx configuration document from Firestore
   * @param decryptValues If true, attempts to decrypt connectionId and apiKey (SuperAdmin only)
   */
  public static async getConfig(decryptValues = false): Promise<TelnyxIntegrationConfig | null> {
    try {
      let data: TelnyxIntegrationConfig | null = null;

      // 1. Primary path: settings_integrations/telnyx
      try {
        const docRef = doc(db, SETTINGS_COLLECTION, TELNYX_DOC_ID);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          data = snap.data() as TelnyxIntegrationConfig;
        }
      } catch {
        // Fallback to other paths
      }

      // 2. Settings document with nested integration: settings/integrations (data.telnyx)
      if (!data) {
        try {
          const docRef = doc(db, 'settings', 'integrations');
          const snap = await getDoc(docRef);
          if (snap.exists() && snap.data()?.telnyx) {
            data = snap.data().telnyx as TelnyxIntegrationConfig;
          }
        } catch {
          // Fallback
        }
      }

      // 3. Document in settings/telnyx
      if (!data) {
        try {
          const docRef = doc(db, 'settings', TELNYX_DOC_ID);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            data = snap.data() as TelnyxIntegrationConfig;
          }
        } catch {
          // Fallback
        }
      }

      if (!data) {
        return null;
      }

      if (decryptValues) {
        return {
          ...data,
          connectionId: await decryptData(data.connectionId),
          apiKey: await decryptData(data.apiKey)
        };
      }

      return data;
    } catch (err) {
      console.error('[TelnyxConfigService] Error reading config from Firestore:', err);
      return null;
    }
  }

  /**
   * Safe status check for SoftphoneDialer and non-admin interfaces.
   * NEVER returns decrypted credentials.
   */
  public static async getPublicStatus(): Promise<TelnyxPublicStatus> {
    try {
      const config = await this.getConfig(false);
      if (!config || !config.apiKey || !config.connectionId) {
        return {
          id: 'telnyx',
          enabled: false,
          isConfigured: false,
          lastTestResult: 'untested',
          availableNumbers: []
        };
      }

      return {
        id: 'telnyx',
        enabled: !!config.enabled,
        isConfigured: true,
        lastTestedAt: config.lastTestedAt,
        lastTestResult: config.lastTestResult || 'untested',
        lastTestMessage: config.lastTestMessage,
        availableNumbers: config.availableNumbers || [],
        maskedConnectionId: maskSensitiveKey(config.connectionId, 3),
        configuredByEmail: config.configuredByEmail,
        updatedAt: config.updatedAt
      };
    } catch (err) {
      console.error('[TelnyxConfigService] Error getting public status:', err);
      return {
        id: 'telnyx',
        enabled: false,
        isConfigured: false,
        lastTestResult: 'untested',
        availableNumbers: []
      };
    }
  }

  /**
   * Encrypts and securely saves Telnyx credentials into Firestore.
   * Generates an audit log entry on completion.
   */
  public static async saveConfig(params: {
    connectionId: string;
    apiKey: string;
    enabled?: boolean;
    availableNumbers?: string[];
    testResult?: 'success' | 'error';
    testMessage?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, error: 'Se requiere sesión activa de SuperAdmin o Admin.' };
      }

      // 1. Encrypt credentials with Web Crypto API AES-GCM
      const encryptedConnId = await encryptData(params.connectionId.trim());
      const encryptedApiKey = await encryptData(params.apiKey.trim());

      const payload: TelnyxIntegrationConfig = {
        id: 'telnyx',
        enabled: params.enabled !== undefined ? params.enabled : true,
        connectionId: encryptedConnId,
        apiKey: encryptedApiKey,
        availableNumbers: params.availableNumbers || [],
        lastTestedAt: serverTimestamp(),
        lastTestResult: params.testResult || 'success',
        lastTestMessage: params.testMessage || 'Credenciales validadas y cifradas en vault',
        configuredBy: currentUser.uid,
        configuredByEmail: currentUser.email || 'unknown',
        configuredAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // Save to primary collection
      const primaryDoc = doc(db, SETTINGS_COLLECTION, TELNYX_DOC_ID);
      await setDoc(primaryDoc, payload, { merge: true });

      // Mirror to settings/integrations doc (telnyx map) and settings/telnyx
      try {
        const integrationsDoc = doc(db, 'settings', 'integrations');
        await setDoc(integrationsDoc, { telnyx: payload }, { merge: true });
      } catch (e) {
        // Non-blocking mirror
      }

      try {
        const mirrorDoc = doc(db, 'settings', TELNYX_DOC_ID);
        await setDoc(mirrorDoc, payload, { merge: true });
      } catch (mirrorErr) {
        // Non-blocking mirror
      }

      // 2. Register audit log
      try {
        await addDoc(collection(db, 'audit_logs'), {
          action: 'TELNYX_CONFIGURED',
          category: 'SECURITY',
          userId: currentUser.uid,
          userEmail: currentUser.email,
          details: {
            provider: 'telnyx',
            enabled: payload.enabled,
            numbersCount: payload.availableNumbers.length,
            maskedConnection: maskSensitiveKey(params.connectionId, 4)
          },
          createdAt: serverTimestamp()
        });
      } catch (auditErr) {
        console.warn('[TelnyxConfigService] Could not write audit log:', auditErr);
      }

      return { success: true };
    } catch (err: any) {
      console.error('[TelnyxConfigService] Error saving config:', err);
      return { success: false, error: err.message || 'Error guardando en Firestore.' };
    }
  }

  /**
   * Toggles integration status (enabled / disabled) without altering stored keys
   */
  public static async toggleEnabled(enabled: boolean): Promise<{ success: boolean; error?: string }> {
    try {
      const primaryDoc = doc(db, SETTINGS_COLLECTION, TELNYX_DOC_ID);
      await updateDoc(primaryDoc, {
        enabled,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  }
}

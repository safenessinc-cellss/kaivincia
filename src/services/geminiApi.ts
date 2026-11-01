import { auth } from '../firebase';

type GeminiTask = 'client-import' | 'chat-suggestions' | 'chat-summary' | 'notification';

export async function requestGemini<T = Record<string, unknown>>(
  task: GeminiTask,
  payload: Record<string, unknown>
): Promise<T> {
  const currentUser = auth.currentUser;
  if (!currentUser) throw new Error('Debes iniciar sesión para utilizar el asistente de IA.');

  const token = await currentUser.getIdToken();
  const response = await fetch('/api/gemini', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ task, ...payload })
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `El servicio de IA respondió con estado ${response.status}.`);
  }
  return result as T;
}

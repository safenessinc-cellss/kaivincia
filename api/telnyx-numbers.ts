import { getAuth } from 'firebase/auth';

async function cargarNumerosTelnyx() {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.error('❌ No hay usuario autenticado en Firebase');
      return;
    }

    // Forzar token fresco (evita expiración)
    const token = await user.getIdToken(true);
    console.log('🔑 Token obtenido, longitud:', token.length);

    const response = await fetch('/api/telnyx-numbers', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error del servidor:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ Números recibidos:', data);
    return data.numbers || [];
  } catch (err) {
    console.error('❌ Error en cargarNumerosTelnyx:', err);
    return [];
  }
}

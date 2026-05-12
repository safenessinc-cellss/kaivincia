import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { LOGO_FULL } from '../constants/images';

export default function LoginPage() {
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Si llegamos aquí, el login fue exitoso
      // El redireccionamiento se maneja en otro lugar (App.tsx o router)
    } catch (err: any) {
      // Ignorar errores de ventana emergente cancelada
      if (err.code !== 'auth/cancelled-popup-request') {
        // Solo mostrar errores que no sean de cancelación
        setError(err.message);
        console.error('Erro no login:', err);
      }
      // Si el error es 'auth/cancelled-popup-request', no hacemos nada
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img 
            src={LOGO_FULL} 
            alt="Kaivincia Corp Logo" 
            className="h-16 object-contain"
            referrerPolicy="no-referrer"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Ingresa a Kaivincia Corp
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-gray-200">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4">
              {error}
            </div>
          )}
          
          <button
            onClick={handleGoogleLogin}
            className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00F0FF]"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5 mr-2" />
            Continuar con Google
          </button>
        </div>
      </div>
    </div>
  );
}

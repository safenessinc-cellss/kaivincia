import { useState } from 'react';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase';
import { LOGO_FULL } from '../constants/images';
import Logo from '../components/Logo';

export default function LoginPage() {
  const [error, setError] = useState('');

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <img src="/images/logo.png" alt="Kaivincia Logo" className="h-10 w-auto object-contain scale-125" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 font-serif">
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

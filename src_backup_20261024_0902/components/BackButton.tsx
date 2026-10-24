import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  label?: string;
  className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ label = 'Volver', className = '' }) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(-1)}
      className={`p-3 bg-gray-900 text-white rounded-2xl hover:bg-[#00F0FF] transition-all group shadow-xl active:scale-90 flex items-center gap-2 ${className}`}
    >
      <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
      {label && <span className="text-[10px] font-black uppercase tracking-widest px-2">{label}</span>}
    </button>
  );
};

export default BackButton;

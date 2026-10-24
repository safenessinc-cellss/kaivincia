import { Area } from '../../types/automation';
import { AREAS } from '../../config/automationCatalog';
import { 
  Megaphone, 
  Target, 
  Headphones, 
  GraduationCap, 
  Receipt, 
  CheckSquare, 
  Users, 
  DollarSign 
} from 'lucide-react';

interface AreaSelectorProps {
  selectedArea: Area;
  onSelectArea: (area: Area) => void;
  disabled?: boolean;
}

const ICON_MAP: Record<string, any> = {
  Megaphone,
  Target,
  Headphones,
  GraduationCap,
  Receipt,
  CheckSquare,
  Users,
  DollarSign
};

export default function AreaSelector({ selectedArea, onSelectArea, disabled }: AreaSelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-black uppercase tracking-wider text-gray-300 flex items-center gap-2">
          <span className="w-5 h-5 rounded-full bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] flex items-center justify-center text-[10px]">1</span>
          Selecciona el Área Operativa
        </label>
        <span className="text-[10px] text-gray-400 font-mono">Paso 1 de 3</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {AREAS.map((area) => {
          const Icon = ICON_MAP[area.iconName] || Target;
          const isSelected = selectedArea === area.id;

          return (
            <button
              key={area.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectArea(area.id)}
              className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-[#00F0FF] ring-2 ring-[#00F0FF]/30 shadow-lg shadow-[#00F0FF]/10'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-2.5 mb-2">
                <div className={`p-2 rounded-xl border ${area.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-black uppercase tracking-tight text-white group-hover:text-[#00F0FF] transition-colors">
                  {area.name}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                {area.description}
              </p>

              {isSelected && (
                <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#00F0FF] shadow-[0_0_8px_#00F0FF]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, GraduationCap, Play, Users, Search, Plus } from 'lucide-react';

export default function Academy() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 h-full pb-10">
      <div className="flex justify-between items-center bg-white/50 p-6 rounded-[2rem] border border-gray-100 shadow-sm">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-3 bg-gray-900 text-white rounded-2xl hover:bg-[#00F0FF] transition-all group shadow-xl active:scale-90"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter italic">Academia Kaivincia</h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">Ecosistema de Entrenamiento Elite</p>
          </div>
        </div>
        <button className="bg-[#00F0FF] text-black px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black hover:text-[#00F0FF] transition-all shadow-xl flex items-center gap-2 group">
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Crear Masterclass
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { title: 'Inducción de Ventas High Ticket', students: 12, modules: 5, status: 'Activo', icon: Play, color: 'text-blue-500' },
          { title: 'Optimización de Nodos CRM', students: 8, modules: 3, status: 'Activo', icon: GraduationCap, color: 'text-[#00F0FF]' },
          { title: 'Psicología de Cierre Maestro', students: 15, modules: 8, status: 'Borrador', icon: BookOpen, color: 'text-amber-500' }
        ].map((course, i) => (
          <div key={i} className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 hover:shadow-[#00F0FF]/10 transition-all group">
            <div className="flex justify-between items-start mb-6">
               <div className={`h-12 w-12 rounded-2xl bg-gray-50 flex items-center justify-center ${course.color} group-hover:scale-110 transition-transform`}>
                  <course.icon className="w-6 h-6" />
               </div>
               <span className={`px-4 py-1.5 text-[9px] font-black rounded-full uppercase tracking-widest ${course.status === 'Activo' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-gray-100 text-gray-400 border border-gray-200'}`}>
                {course.status}
              </span>
            </div>
            
            <h3 className="font-black text-xl text-gray-900 uppercase tracking-tighter italic mb-4 line-clamp-2">{course.title}</h3>
            
            <div className="flex items-center gap-6 mb-8 text-[10px] font-black text-gray-400 uppercase tracking-widest">
               <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#00F0FF]" /> {course.students} Alumnos
               </div>
               <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-gray-300" /> {course.modules} Módulos
               </div>
            </div>

            <button className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#00F0FF] hover:text-black transition-all shadow-lg active:scale-95">
               Gestionar Curso
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage, handleFirestoreError, OperationType } from '../firebase';
import { Calendar as CalendarIcon, BookOpen, CheckCircle2, Circle, Clock, Target, TrendingUp, Sparkles, ChevronRight, Edit2, Camera, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';

export default function UserPortal() {
  const { userData } = useOutletContext<{ userData: any }>();
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (userData) {
      setEditName(userData.name || '');
    }
  }, [userData]);

  const handleUpdateProfile = async () => {
    if (!userData?.uid) return;
    try {
      const userRef = doc(db, 'users', userData.uid);
      await updateDoc(userRef, { name: editName });
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: editName });
      }
      setIsEditingProfile(false);
    } catch (error) {
      console.error("Error updating profile", error);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userData?.uid || !auth.currentUser) return;

    if (!storage) {
      alert("El servicio de almacenamiento no está disponible actualmente.");
      return;
    }

    setUploadingAvatar(true);
    try {
      const storageRef = ref(storage, `avatars/${userData.uid}_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const photoUrl = await getDownloadURL(storageRef);

      const userRef = doc(db, 'users', userData.uid);
      await updateDoc(userRef, { avatarUrl: photoUrl });
      await updateProfile(auth.currentUser, { photoURL: photoUrl });
    } catch (error) {
      console.error("Error uploading avatar", error);
      alert("Error al subir la imagen. Intenta de nuevo.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    if (!userData?.uid) return;

    const qTasks = query(
      collection(db, 'tasks'), 
      where('assignedTo', '==', userData.uid)
    );
    
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      const sortedTasks = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
      
      setTasks(sortedTasks);
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'tasks'));

    return () => unsubTasks();
  }, [userData?.uid]);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full"
      />
    </div>
  );

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const weeklyGoal = { current: 1250, target: 2500, label: 'Comisiones Semanales' };

  return (
    <div className="space-y-8 max-w-7xl mx-auto p-4 md:p-8 font-sans bg-[#0c0f1d] min-h-screen -m-6 p-6 overflow-hidden relative">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10"
      >
        <div className="flex items-center gap-6">
          {/* Logo de la empresa */}
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="h-16 w-auto object-contain hover:scale-105 transition-transform duration-300" 
          />
          
          {/* Avatar del usuario */}
          <div className="relative group">
             {userData?.avatarUrl ? (
               <img src={userData.avatarUrl} alt={userData?.name} className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500/30" />
             ) : (
               <div className="w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center text-2xl font-black text-white border-2 border-emerald-500/30 shadow-lg">
                 {userData?.name?.charAt(0) || 'U'}
               </div>
             )}
             <button 
               onClick={() => fileInputRef.current?.click()}
               className="absolute bottom-[-8px] right-[-8px] bg-emerald-500 text-white p-1.5 rounded-lg shadow-lg hover:bg-emerald-400 transition-colors z-10"
             >
               {uploadingAvatar ? <motion.div animate={{rotate: 360}} transition={{repeat:Infinity, duration: 1}}><Target className="w-4 h-4"/></motion.div> : <Camera className="w-4 h-4" />}
             </button>
             <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
          </div>
          
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">
                {userData?.name} <span className="text-emerald-500 text-2xl cursor-pointer hover:text-emerald-400 transition-colors" onClick={() => setIsEditingProfile(true)}><Edit2 className="inline w-5 h-5 mb-1" /></span>
              </h2>
            </div>
            <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-3 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-emerald-400" /> Miembro {userData?.role} • Kaivincia
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center gap-4 shadow-2xl">
             <div className="h-10 w-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
             </div>
             <div>
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Efficiency</p>
                <p className="text-lg font-black text-white italic">94.2%</p>
             </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isEditingProfile && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-6 overflow-hidden"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold uppercase tracking-widest text-sm">Editar Perfil</h3>
              <button onClick={() => setIsEditingProfile(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex gap-4">
              <input 
                type="text" 
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                placeholder="Nombre completo"
              />
              <button 
                onClick={handleUpdateProfile}
                className="bg-emerald-500 text-white font-bold uppercase tracking-widest px-8 rounded-xl hover:bg-emerald-400 transition-colors text-sm shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                Guardar Cambios
              </button>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5 flex justify-end">
              <button
                onClick={async () => {
                  if (auth.currentUser && userData?.uid) {
                    const photo = auth.currentUser.photoURL || '';
                    const name = auth.currentUser.displayName || '';
                    try {
                      await updateDoc(doc(db, 'users', userData.uid), {
                        name: name,
                        avatarUrl: photo
                      });
                      setEditName(name);
                      alert('Datos sincronizados con Google');
                    } catch (e) {
                      console.error(e);
                    }
                  }
                }}
                className="text-[10px] text-gray-400 font-bold uppercase hover:text-white transition-colors"
              >
                Sincronizar datos con Google (Actualizar foto y nombre)
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Left Column: Stats & Goals */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Weekly Goal Widget */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-white/10 to-white/[0.02] backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
               <Target className="w-64 h-64 text-emerald-400" />
            </div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8">
                <div>
                   <h3 className="text-xs font-black text-emerald-400 uppercase tracking-[0.3em] italic mb-1 flex items-center gap-2">
                      <Target className="w-4 h-4" /> Meta Semanal
                   </h3>
                   <h4 className="text-3xl font-black text-white italic tracking-tighter uppercase">{weeklyGoal.label}</h4>
                </div>
                <div className="text-right">
                   <p className="text-4xl font-black text-white italic tracking-tighter">${weeklyGoal.current}</p>
                   <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Objetivo: ${weeklyGoal.target}</p>
                </div>
              </div>

              <div className="space-y-4">
                 <div className="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                    <span>Performance</span>
                    <span className="text-emerald-400">50% Logrado</span>
                 </div>
                 <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(weeklyGoal.current / weeklyGoal.target) * 100}%` }}
                      className="h-full bg-gradient-to-r from-emerald-600 to-blue-600 rounded-full"
                    />
                 </div>
              </div>
            </div>
          </motion.div>

          {/* Task Widget */}
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col">
            <div className="p-8 border-b border-white/5 bg-white/[0.02] flex justify-between items-center">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] italic flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Smart Task Manager
              </h3>
              <div className="flex gap-2">
                 <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-widest rounded-full">
                    {pendingTasks.length} Activas
                 </span>
              </div>
            </div>
            
            <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto custom-scrollbar">
              {pendingTasks.map((task, idx) => (
                <motion.div 
                  key={task.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="p-8 hover:bg-white/[0.03] flex items-center gap-6 group cursor-pointer transition-all border-l-4 border-transparent hover:border-emerald-500"
                >
                  <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                     <Circle className="h-6 w-6 text-gray-600 group-hover:text-emerald-500" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-black text-white italic tracking-tighter uppercase group-hover:text-emerald-400 transition-colors tabular-nums">{task.title}</h4>
                    <div className="flex items-center gap-6 mt-2">
                       <div className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                          <Clock className="w-3.5 h-3.5" /> {format(parseISO(task.dueDate), 'MMM dd, yyyy')}
                       </div>
                       <div className="w-1 h-1 bg-white/10 rounded-full" />
                       <span className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest italic">{task.category || 'General'}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-700 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-2" />
                </motion.div>
              ))}
              {pendingTasks.length === 0 && (
                <div className="p-20 text-center flex flex-col items-center">
                   <div className="w-20 h-20 bg-emerald-500/5 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-10 h-10 text-emerald-500/20" />
                   </div>
                   <p className="text-xs font-black text-gray-500 uppercase tracking-widest italic">Zona Clear: No hay tareas críticas</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Courses & Calendar */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Courses Progress */}
          <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] italic mb-10 flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-emerald-500" /> Learning Path
            </h3>
            
            <div className="space-y-8">
              {[
                { title: 'Tecnicas de Cierre B2B', progress: 45, color: 'blue', status: 'In Progress' },
                { title: 'Onboarding Corporativo', progress: 100, color: 'emerald', status: 'Completed' }
              ].map((course, i) => (
                <div key={i} className="group cursor-pointer">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                         <p className="text-[8px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">{course.status}</p>
                         <h4 className="text-sm font-black text-white italic uppercase tracking-tighter group-hover:text-emerald-400 transition-colors">{course.title}</h4>
                    </div>
                    <span className={`text-xl font-black italic tracking-tighter ${course.progress === 100 ? 'text-emerald-500' : 'text-blue-400'}`}>{course.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${course.progress}%` }}
                      className={`h-full bg-gradient-to-r ${course.color === 'emerald' ? 'from-emerald-600 to-green-400' : 'from-blue-600 to-indigo-400'}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-12 py-5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black text-white uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all active:scale-95 italic">
               Explorar Academia &rarr;
            </button>
          </div>

          {/* Quick Calendar Access */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-gradient-to-br from-emerald-900/40 to-blue-900/40 backdrop-blur-3xl border border-emerald-500/20 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group cursor-pointer"
          >
            <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:rotate-12 transition-transform">
               <CalendarIcon className="w-32 h-32 text-white" />
            </div>
            
            <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] italic mb-4 flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-emerald-400" /> Agenda VIP
            </h3>
            <p className="text-xs text-gray-300 font-bold uppercase tracking-widest leading-relaxed mb-10 italic">
               Se han sincronizado <span className="text-white">{pendingTasks.length} eventos</span> en tu calendario de ejecucion.
            </p>
            
            <button 
              onClick={() => window.location.href = '/crm/tasks'}
              className="w-full bg-white text-black py-5 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-emerald-500 transition-all text-[10px] italic shadow-2xl"
            >
              Open Global Protocol
            </button>
          </motion.div>
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.02);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}

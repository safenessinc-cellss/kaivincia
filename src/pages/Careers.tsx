import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import { Briefcase, MapPin, Clock, ChevronRight, Search } from 'lucide-react';
import { LOGO_FULL } from '../constants/images';

export default function Careers() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const q = query(
      collection(db, 'jobs'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setJobs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }, (error) => {
      console.error("Error fetching jobs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredJobs = jobs.filter(job => 
    job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
    job.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link to="/">
            <img src="/images/logo.png" alt="Kaivincia Logo" className="h-10 w-auto object-contain" />
          </Link>
          <nav className="flex gap-4">
            <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900">Portal de Empleados</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gray-900 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">Únete a nuestro equipo</h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            Buscamos talento excepcional para construir el futuro de las ventas y la tecnología. Descubre nuestras vacantes abiertas y postula hoy mismo.
          </p>
          
          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Buscar por puesto, departamento o ubicación..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 rounded-xl border-0 ring-1 ring-inset ring-gray-700 bg-gray-800 text-white placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#00F0FF] sm:text-lg shadow-xl outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Job Listings */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Vacantes Disponibles</h2>
            <p className="text-gray-500 mt-1">Encontramos {filteredJobs.length} posiciones abiertas</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-[#00F0FF]"></div>
            <p className="mt-4 text-gray-500 font-medium">Cargando vacantes...</p>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow group">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-full">
                        {job.department}
                      </span>
                      {job.isUrgent && (
                        <span className="bg-red-50 text-red-700 text-xs font-bold px-2.5 py-1 rounded-full">
                          Urgente
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#00F0FF] transition-colors">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4" /> {job.location}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4" /> {job.type}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4" /> Publicado {new Date(job.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {job.description && (
                      <p className="mt-4 text-gray-600 text-sm line-clamp-2">
                        {job.description}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    <Link 
                      to={`/apply?role=${encodeURIComponent(job.title)}&jobId=${job.id}`}
                      className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-black transition-colors w-full md:w-auto"
                    >
                      Postularme <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
            <Briefcase className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No hay vacantes que coincidan</h3>
            <p className="mt-1 text-gray-500">Intenta ajustar tu búsqueda o vuelve más tarde.</p>
            <button 
              onClick={() => setSearchTerm('')}
              className="mt-6 text-[#00F0FF] font-medium hover:underline"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </main>
    </div>
  );
}


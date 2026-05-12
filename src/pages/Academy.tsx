export default function Academy() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Academia Kaivincia</h2>
        <button className="bg-[#00F0FF] text-black px-4 py-2 rounded-lg font-medium hover:bg-[#00BFFF]">
          Crear Curso
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { title: 'Inducción de Ventas', students: 12, modules: 5, status: 'Activo' },
          { title: 'Manejo de CRM', students: 8, modules: 3, status: 'Activo' },
          { title: 'Técnicas de Cierre', students: 15, modules: 8, status: 'Borrador' }
        ].map((course, i) => (
          <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-lg">{course.title}</h3>
              <span className={`px-2 py-1 text-xs rounded-full ${course.status === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {course.status}
              </span>
            </div>
            <div className="text-sm text-gray-500 space-y-2">
              <p>Estudiantes: {course.students}</p>
              <p>Módulos: {course.modules}</p>
            </div>
            <button className="mt-6 w-full py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
              Gestionar Curso
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

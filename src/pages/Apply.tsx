import { useState, useRef, useEffect } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { CheckCircle2, UploadCloud, FileText, Image as ImageIcon, X, Bot, Loader2, Circle, ArrowLeft } from 'lucide-react';
import { LOGO_FULL } from '../constants/images';
import * as pdfjsLib from 'pdfjs-dist';
import { GoogleGenAI } from '@google/genai';
import { useSearchParams, useNavigate } from 'react-router-dom';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function Apply() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || '';
  const jobId = searchParams.get('jobId') || '';

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiStatus, setAiStatus] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    linkedin: '',
    role: initialRole,
    experience: '',
  });

  // Skills Tags
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState('');

  // Files
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialRole) {
      setFormData(prev => ({ ...prev, role: initialRole }));
    }
  }, [initialRole]);

  const handleAddSkill = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && currentSkill.trim()) {
      e.preventDefault();
      if (!skills.includes(currentSkill.trim())) {
        setSkills([...skills, currentSkill.trim()]);
      }
      setCurrentSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const extractTextFromPDF = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n';
      }
      return fullText;
    } catch (error) {
      console.error("Error extracting PDF text:", error);
      throw new Error("No se pudo leer el archivo PDF.");
    }
  };

  const analyzeResumeWithAI = async (resumeText: string, role: string) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY || ((import.meta as any).env && (import.meta as any).env.VITE_GEMINI_API_KEY);
      if (!apiKey || apiKey === "undefined") throw new Error("GEMINI_API_KEY is not defined. Please set it in Settings > Secrets in AI Studio.");
      const ai = new GoogleGenAI({ apiKey });
      
      const prompt = `
        Actúa como un reclutador experto. Analiza el siguiente currículum para el puesto de "${role}".
        Primero, infiere los Términos de Referencia (TDR) típicos para este puesto.
        Luego, extrae las habilidades, experiencia y educación del candidato.
        Compara el CV contra el TDR inferido.
        Asigna una puntuación de coherencia (Match Score) del 1 al 100.
        Justifica por qué el candidato es apto o no apto para el puesto.

        Devuelve un objeto JSON estricto con la siguiente estructura:
        {
          "score": (número del 1 al 100),
          "summary": (un resumen de 2-3 líneas sobre el candidato),
          "justification": (justificación detallada de por qué es apto o no, comparando su experiencia con el TDR del puesto),
          "extractedSkills": (un arreglo de strings con las 5 habilidades más relevantes encontradas)
        }
        
        Currículum:
        ${resumeText.substring(0, 15000)}
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const resultText = response.text;
      if (!resultText) throw new Error("Respuesta vacía de la IA");
      
      return JSON.parse(resultText);
    } catch (error) {
      console.error("Error AI Analysis:", error);
      return {
        score: 0,
        summary: "No se pudo generar el análisis automático.",
        extractedSkills: []
      };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) {
      alert("Por favor, sube tu currículum en PDF.");
      return;
    }

    setLoading(true);
    try {
      setAiStatus('Leyendo currículum...');
      const resumeText = await extractTextFromPDF(resumeFile);
      
      setAiStatus('Analizando perfil con Inteligencia Artificial...');
      const aiAnalysis = await analyzeResumeWithAI(resumeText, formData.role);

      setAiStatus('Guardando postulación...');
      await addDoc(collection(db, 'candidates'), {
        ...formData,
        jobId,
        skills,
        status: 'Nuevo',
        aiScore: aiAnalysis.score,
        aiSummary: aiAnalysis.summary,
        aiJustification: aiAnalysis.justification || '',
        aiExtractedSkills: aiAnalysis.extractedSkills,
        hasPhoto: !!photoFile,
        hasResume: !!resumeFile,
        createdAt: new Date().toISOString()
      });
      
      setSubmitted(true);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'candidates');
      alert("Hubo un error al enviar la postulación. Inténtalo de nuevo.");
    } finally {
      setLoading(false);
      setAiStatus('');
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">¡Postulación Enviada!</h2>
          <p className="text-gray-600">
            Nuestra Inteligencia Artificial ha procesado tu perfil. El equipo de reclutamiento se pondrá en contacto contigo pronto.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver</span>
          </button>
          <img src="/images/logo.png" alt="Kaivincia Logo" className="h-10 w-auto object-contain" />
          <div className="w-20" /> {/* Spacer to balance the logo */}
        </div>
        
        <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-200">
          {/* Tabs Header */}
          <div className="flex border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab(0)}
              className={`flex-1 py-4 px-6 text-sm font-medium text-center transition-colors ${
                activeTab === 0 ? 'border-b-2 border-[#00F0FF] text-[#00F0FF] bg-cyan-500/10/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              1. Información General
            </button>
            <button
              type="button"
              onClick={() => setActiveTab(1)}
              className={`flex-1 py-4 px-6 text-sm font-medium text-center transition-colors ${
                activeTab === 1 ? 'border-b-2 border-[#00F0FF] text-[#00F0FF] bg-cyan-500/10/30' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              2. Carga de Archivos
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            {/* Tab 1: General Info */}
            <div className={activeTab === 0 ? 'block' : 'hidden'}>
              <h3 className="text-xl font-bold text-gray-900 mb-6">Datos Personales y Profesionales</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#00F0FF] focus:ring-[#00F0FF] p-2.5 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#00F0FF] focus:ring-[#00F0FF] p-2.5 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono / WhatsApp</label>
                  <input required type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#00F0FF] focus:ring-[#00F0FF] p-2.5 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad de Residencia</label>
                  <input 
                    required 
                    type="text" 
                    list="cities" 
                    value={formData.city} 
                    onChange={e => setFormData({...formData, city: e.target.value})} 
                    className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#00F0FF] focus:ring-[#00F0FF] p-2.5 border" 
                    placeholder="Empieza a escribir tu ciudad..." 
                  />
                  <datalist id="cities">
                    <option value="Ciudad de México, México" />
                    <option value="Monterrey, México" />
                    <option value="Guadalajara, México" />
                    <option value="Bogotá, Colombia" />
                    <option value="Medellín, Colombia" />
                    <option value="Cali, Colombia" />
                    <option value="Buenos Aires, Argentina" />
                    <option value="Córdoba, Argentina" />
                    <option value="Lima, Perú" />
                    <option value="Santiago, Chile" />
                    <option value="Madrid, España" />
                    <option value="Barcelona, España" />
                    <option value="Valencia, España" />
                    <option value="Miami, USA" />
                    <option value="Los Angeles, USA" />
                    <option value="New York, USA" />
                    <option value="Houston, USA" />
                  </datalist>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enlace a LinkedIn o Portafolio</label>
                  <input required type="url" value={formData.linkedin} onChange={e => setFormData({...formData, linkedin: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#00F0FF] focus:ring-[#00F0FF] p-2.5 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Puesto de Interés</label>
                  <input required type="text" placeholder="Ej: Desarrollador Frontend, Closer de Ventas" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#00F0FF] focus:ring-[#00F0FF] p-2.5 border" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Años de Experiencia</label>
                  <select required value={formData.experience} onChange={e => setFormData({...formData, experience: e.target.value})} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-[#00F0FF] focus:ring-[#00F0FF] p-2.5 border bg-white">
                    <option value="">Selecciona una opción</option>
                    <option value="Sin experiencia">Sin experiencia (Junior/Trainee)</option>
                    <option value="1-3 años">1 a 3 años</option>
                    <option value="3-5 años">3 a 5 años</option>
                    <option value="Más de 5 años">Más de 5 años (Senior)</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Habilidades Principales (Presiona Enter para agregar)</label>
                  <div className="p-2 border border-gray-300 rounded-lg shadow-sm focus-within:border-[#00F0FF] focus-within:ring-1 focus-within:ring-[#00F0FF] bg-white flex flex-wrap gap-2">
                    {skills.map(skill => (
                      <span key={skill} className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)} className="text-gray-500 hover:text-red-500"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    <input 
                      type="text" 
                      value={currentSkill} 
                      onChange={e => setCurrentSkill(e.target.value)} 
                      onKeyDown={handleAddSkill}
                      placeholder="Ej: React, Ventas B2B, Liderazgo..." 
                      className="flex-1 min-w-[150px] outline-none text-sm p-1" 
                    />
                  </div>
                </div>
              </div>
              <div className="mt-8 flex justify-end">
                <button type="button" onClick={() => setActiveTab(1)} className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-black transition-colors">
                  Siguiente Paso
                </button>
              </div>
            </div>

            {/* Tab 2: File Upload */}
            <div className={activeTab === 1 ? 'block' : 'hidden'}>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Documentación y Análisis IA</h3>
              <p className="text-gray-500 text-sm mb-6">Sube tus documentos. Nuestra IA analizará tu perfil para agilizar el proceso.</p>
              
              <div className="space-y-6">
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Foto de Perfil (.jpg, .png)</label>
                  <div 
                    onClick={() => photoInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors ${photoFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:bg-gray-50 hover:border-[#00F0FF]'}`}
                  >
                    <input 
                      type="file" 
                      ref={photoInputRef} 
                      onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} 
                      accept=".jpg,.jpeg,.png" 
                      className="hidden" 
                    />
                    {photoFile ? (
                      <div className="flex flex-col items-center gap-2 text-green-700">
                        <div className="bg-green-100 p-2 rounded-full">
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        </div>
                        <span className="font-bold">{photoFile.name}</span>
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-medium">Foto cargada correctamente</span>
                      </div>
                    ) : (
                      <>
                        <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600 font-medium">Haz clic para subir tu foto</p>
                        <p className="text-xs text-gray-400 mt-1">Máx 5MB</p>
                      </>
                    )}
                  </div>
                </div>

                {/* Resume Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Currículum Vitae (.pdf)</label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors ${resumeFile ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:bg-gray-50 hover:border-[#00F0FF] bg-blue-50/30'}`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={(e) => setResumeFile(e.target.files?.[0] || null)} 
                      accept=".pdf" 
                      className="hidden" 
                    />
                    {resumeFile ? (
                      <div className="flex flex-col items-center gap-2 text-green-700">
                        <div className="bg-green-100 p-3 rounded-full">
                          <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <span className="font-bold text-gray-900">{resumeFile.name}</span>
                        <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full font-medium">CV listo para análisis de IA</span>
                      </div>
                    ) : (
                      <>
                        <FileText className="w-12 h-12 text-[#00F0FF] opacity-50 mb-3" />
                        <p className="text-base text-gray-700 font-medium">Sube tu CV en formato PDF</p>
                        <p className="text-sm text-gray-500 mt-1 text-center max-w-xs">
                          Requerido para que nuestra Inteligencia Artificial evalúe tu compatibilidad.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Progress Indicator */}
              {loading && (
                <div className="mt-6 p-5 bg-blue-50 rounded-xl border border-blue-100 shadow-inner">
                  <h4 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2">
                    <Bot className="w-5 h-5 animate-pulse text-blue-600" /> Procesando tu postulación con IA
                  </h4>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      {aiStatus === 'Leyendo currículum...' ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-green-500" />}
                      <span className={`text-sm ${aiStatus === 'Leyendo currículum...' ? 'text-blue-800 font-bold' : 'text-gray-500'}`}>1. Extrayendo texto del documento PDF</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {aiStatus === 'Leyendo currículum...' ? <Circle className="w-5 h-5 text-gray-300" /> : aiStatus === 'Analizando perfil con Inteligencia Artificial...' ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" /> : <CheckCircle2 className="w-5 h-5 text-green-500" />}
                      <span className={`text-sm ${aiStatus === 'Analizando perfil con Inteligencia Artificial...' ? 'text-blue-800 font-bold' : aiStatus === 'Guardando postulación...' ? 'text-gray-500' : 'text-gray-400'}`}>2. Análisis de IA (Extracción de Skills y Score)</span>
                    </div>
                    <div className="flex items-center gap-3">
                      {aiStatus === 'Guardando postulación...' ? <Loader2 className="w-5 h-5 text-blue-500 animate-spin" /> : aiStatus === '' ? <Circle className="w-5 h-5 text-gray-300" /> : <Circle className="w-5 h-5 text-gray-300" />}
                      <span className={`text-sm ${aiStatus === 'Guardando postulación...' ? 'text-blue-800 font-bold' : 'text-gray-400'}`}>3. Guardando perfil en la base de datos</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-between items-center">
                <button type="button" onClick={() => setActiveTab(0)} disabled={loading} className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 disabled:opacity-50">
                  Volver
                </button>
                <button 
                  type="submit" 
                  disabled={loading || !resumeFile}
                  className="bg-[#00F0FF] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#00BFFF] transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      <Bot className="w-5 h-5" />
                      Enviar y Analizar con IA
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


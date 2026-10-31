import React, { useMemo, useState } from 'react';
import {
  BookOpen, Search, Printer, ShieldCheck, FileText, ChevronRight,
  CheckCircle2, AlertTriangle, ClipboardCheck, Users, CalendarClock,
  ListChecks, SearchX, ArrowUpRight
} from 'lucide-react';
import { MANUAL_DEPARTMENTS, MANUAL_DOCUMENTS } from '../data/sopManuals';

export default function SOPManuals() {
  const [activeDept, setActiveDept] = useState(MANUAL_DEPARTMENTS[0]?.id ?? '');
  const [activeDoc, setActiveDoc] = useState(MANUAL_DOCUMENTS[0]?.id ?? '');
  const [search, setSearch] = useState('');
  const [completed, setCompleted] = useState<Record<string, boolean>>({});

  const normalizedSearch = search.trim().toLocaleLowerCase();
  const filteredDepartments = useMemo(() => MANUAL_DEPARTMENTS.map(department => ({
    ...department,
    documents: department.documents.filter(document => {
      if (!normalizedSearch) return true;
      const haystack = [
        document.id, document.title, document.summary, document.owner,
        document.audience,
        ...document.sections.flatMap(section => [
          section.heading, section.intro ?? '', ...(section.bullets ?? []),
          ...(section.steps ?? []).flatMap(step => [step.title, step.detail]),
          ...(section.checklist ?? [])
        ])
      ].join(' ').toLocaleLowerCase();
      return haystack.includes(normalizedSearch);
    })
  })).filter(department => department.documents.length > 0), [normalizedSearch]);

  const selectedDepartment = filteredDepartments.find(department => department.id === activeDept)
    ?? filteredDepartments[0];
  const selectedDocument = selectedDepartment?.documents.find(document => document.id === activeDoc)
    ?? selectedDepartment?.documents[0];

  const selectDepartment = (id: string) => {
    setActiveDept(id);
    const department = filteredDepartments.find(item => item.id === id);
    setActiveDoc(department?.documents[0]?.id ?? '');
  };

  const selectDocument = (id: string) => setActiveDoc(id);

  const toggleChecklist = (key: string) => {
    setCompleted(previous => ({ ...previous, [key]: !previous[key] }));
  };

  const allChecklistItems = selectedDocument?.sections.flatMap((section, sectionIndex) =>
    (section.checklist ?? []).map((item, itemIndex) => ({
      key: selectedDocument.id + ':' + sectionIndex + ':' + itemIndex,
      checked: Boolean(completed[selectedDocument.id + ':' + sectionIndex + ':' + itemIndex])
    }))
  ) ?? [];
  const doneCount = allChecklistItems.filter(item => item.checked).length;
  const progress = allChecklistItems.length ? Math.round(doneCount / allChecklistItems.length * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F5F7FB] text-[#202124]">
      <style>{`
        @media print {
          body { background: white !important; }
          .manual-no-print { display: none !important; }
          .manual-print { max-width: none !important; padding: 0 !important; }
          .manual-section { break-inside: avoid; box-shadow: none !important; }
          .manual-check { accent-color: #188038; }
        }
      `}</style>

      <div className="flex min-h-screen">
        <aside className="manual-no-print w-full lg:w-[330px] shrink-0 bg-white border-r border-[#E6EAF0] flex flex-col">
          <div className="p-6 border-b border-[#E6EAF0]">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-bold text-base tracking-tight">Manuales Kaivincia</h1>
                <p className="text-[11px] text-[#667085]">Sistema de gestión documental</p>
              </div>
            </div>
            <div className="mt-5 relative">
              <Search className="w-4 h-4 text-[#98A2B3] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Buscar manual, proceso o palabra..."
                aria-label="Buscar manuales"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#DDE3EA] bg-[#F8FAFC] text-sm outline-none focus:ring-2 focus:ring-[#1A73E8]/20 focus:border-[#1A73E8]"
              />
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto p-4">
            <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#98A2B3]">Departamentos</p>
            <div className="space-y-1">
              {filteredDepartments.map(department => (
                <button
                  key={department.id}
                  onClick={() => selectDepartment(department.id)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${activeDept === department.id ? 'bg-[#E8F0FE] text-[#174EA6]' : 'text-[#475467] hover:bg-[#F4F6F8]'}`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${activeDept === department.id ? 'bg-[#1A73E8]' : 'bg-[#C4CBD5]'}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold">{department.name}</span>
                    <span className="block text-[10px] opacity-70 mt-0.5">{department.documents.length} documentos</span>
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-60" />
                </button>
              ))}
              {filteredDepartments.length === 0 && (
                <div className="px-3 py-8 text-center text-sm text-[#667085]">
                  <SearchX className="w-7 h-7 mx-auto mb-2 opacity-50" />
                  No se encontraron manuales.
                </div>
              )}
            </div>

            {selectedDepartment && (
              <div className="mt-7">
                <p className="px-2 mb-2 text-[10px] font-bold uppercase tracking-[.12em] text-[#98A2B3]">Documentos del área</p>
                <div className="space-y-1">
                  {selectedDepartment.documents.map(document => (
                    <button
                      key={document.id}
                      onClick={() => selectDocument(document.id)}
                      className={`w-full text-left p-3 rounded-xl border transition-colors ${activeDoc === document.id ? 'bg-[#F1F6FE] border-[#C9DCF9] text-[#174EA6]' : 'border-transparent text-[#475467] hover:bg-[#F8FAFC]'}`}
                    >
                      <span className="block text-[10px] font-mono opacity-70">{document.id}</span>
                      <span className="block text-xs font-semibold leading-snug mt-1">{document.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </nav>
          <div className="manual-no-print p-4 border-t border-[#E6EAF0] text-[10px] leading-relaxed text-[#98A2B3]">
            Kaivincia Corp · Uso interno
            <br />Consultar siempre la versión aprobada.
          </div>
        </aside>

        <main className="flex-1 min-w-0">
          {selectedDocument ? (
            <article className="manual-print max-w-5xl mx-auto px-5 py-8 md:px-10 md:py-10">
              <div className="manual-no-print flex flex-wrap items-center justify-between gap-3 mb-7">
                <div className="flex items-center gap-2 text-xs text-[#667085]">
                  <span>Manuales</span><ChevronRight className="w-3 h-3" />
                  <span>{selectedDepartment?.name}</span>
                </div>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#1A73E8] hover:bg-[#1765CC] text-white text-xs font-semibold px-4 py-2.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" /> Imprimir / Guardar PDF
                </button>
              </div>

              <header className="bg-white rounded-3xl border border-[#E6EAF0] p-6 md:p-9 shadow-sm">
                <div className="flex flex-wrap items-center gap-2 mb-5">
                  <span className="rounded-lg bg-[#E8F0FE] text-[#174EA6] px-3 py-1.5 text-[10px] font-bold font-mono">{selectedDocument.id}</span>
                  <span className="rounded-lg bg-[#F1F3F4] text-[#5F6368] px-3 py-1.5 text-[10px] font-semibold">Versión 1.0 · 31 oct 2026</span>
                  <span className={`rounded-lg px-3 py-1.5 text-[10px] font-semibold ${selectedDocument.status === 'Vigente como guía base' ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-[#FEF7E0] text-[#8A5A00]'}`}>
                    {selectedDocument.status}
                  </span>
                </div>
                <p className="text-[10px] uppercase tracking-[.16em] text-[#1A73E8] font-bold mb-2">{selectedDepartment?.name}</p>
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight leading-tight text-[#202124]">{selectedDocument.title}</h2>
                <p className="text-sm md:text-base text-[#5F6368] leading-relaxed mt-4 max-w-3xl">{selectedDocument.summary}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-[#EEF1F4]">
                  <div className="flex items-start gap-2.5"><Users className="w-4 h-4 text-[#1A73E8] mt-0.5" /><div><p className="text-[10px] text-[#98A2B3] uppercase font-bold">Propietario</p><p className="text-xs font-semibold mt-1">{selectedDocument.owner}</p></div></div>
                  <div className="flex items-start gap-2.5"><ShieldCheck className="w-4 h-4 text-[#1A73E8] mt-0.5" /><div><p className="text-[10px] text-[#98A2B3] uppercase font-bold">Destinatarios</p><p className="text-xs font-semibold mt-1">{selectedDocument.audience}</p></div></div>
                  <div className="flex items-start gap-2.5"><CalendarClock className="w-4 h-4 text-[#1A73E8] mt-0.5" /><div><p className="text-[10px] text-[#98A2B3] uppercase font-bold">Revisión</p><p className="text-xs font-semibold mt-1">{selectedDocument.reviewCycle}</p></div></div>
                </div>
              </header>

              <div className="manual-no-print mt-5 bg-white rounded-2xl border border-[#E6EAF0] p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#E6F4EA] text-[#188038] flex items-center justify-center"><ClipboardCheck className="w-4 h-4" /></div>
                  <div><p className="text-xs font-bold">Lista de verificación del manual</p><p className="text-[10px] text-[#667085]">{doneCount} de {allChecklistItems.length} controles marcados en esta sesión</p></div>
                </div>
                <div className="w-full sm:w-44 h-2 rounded-full bg-[#EEF1F4] overflow-hidden"><div className="h-full bg-[#188038] rounded-full transition-all" style={{ width: progress + '%' }} /></div>
              </div>

              <div className="space-y-5 mt-7">
                {selectedDocument.sections.map((section, index) => (
                  <section key={section.heading} className="manual-section bg-white rounded-2xl border border-[#E6EAF0] p-5 md:p-7 shadow-sm">
                    <div className="flex items-start gap-3 mb-4">
                      <span className="w-8 h-8 rounded-xl bg-[#E8F0FE] text-[#1A73E8] flex items-center justify-center shrink-0"><FileText className="w-4 h-4" /></span>
                      <div className="min-w-0"><h3 className="text-base font-bold text-[#202124]">{section.heading}</h3>{section.intro && <p className="text-sm text-[#667085] mt-1">{section.intro}</p>}</div>
                    </div>

                    {section.warning && <div className="mb-4 flex gap-2.5 rounded-xl bg-[#FEF7E0] border border-[#FCE8B2] p-3.5 text-xs leading-relaxed text-[#7A5200]"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />{section.warning}</div>}

                    {section.bullets && <ul className="space-y-3 mb-1">{section.bullets.map((item, itemIndex) => <li key={itemIndex} className="flex gap-3 text-sm text-[#475467] leading-relaxed"><CheckCircle2 className="w-4 h-4 text-[#188038] shrink-0 mt-0.5" /><span>{item}</span></li>)}</ul>}

                    {section.steps && <div className="space-y-3">{section.steps.map((step, stepIndex) => <div key={step.title} className="flex gap-3.5"><div className="w-7 h-7 rounded-full bg-[#F1F3F4] text-[#5F6368] flex items-center justify-center text-[11px] font-bold shrink-0">{stepIndex + 1}</div><div className="pb-2"><h4 className="text-sm font-semibold text-[#202124]">{step.title}</h4><p className="text-sm text-[#667085] leading-relaxed mt-1">{step.detail}</p></div></div>)}</div>}

                    {section.checklist && <div className="space-y-3">{section.checklist.map((item, itemIndex) => {
                      const key = selectedDocument.id + ':' + index + ':' + itemIndex;
                      return <label key={key} className="manual-no-print flex items-start gap-3 cursor-pointer group"><input className="manual-check mt-0.5 w-4 h-4 accent-[#188038]" type="checkbox" checked={Boolean(completed[key])} onChange={() => toggleChecklist(key)} /><span className={`text-sm leading-relaxed ${completed[key] ? 'text-[#98A2B3] line-through' : 'text-[#475467]'}`}>{item}</span></label>;
                    })}</div>}
                  </section>
                ))}
              </div>

              <footer className="mt-8 rounded-2xl border border-[#E6EAF0] bg-white p-5 text-xs text-[#667085] leading-relaxed">
                <p className="font-bold text-[#475467] mb-1">Control documental</p>
                Este contenido es una guía operativa. El propietario del proceso debe validar los pasos contra la configuración y los permisos reales de producción antes de aprobarlo como procedimiento oficial. Si la interfaz difiere, prevalecen la política aprobada y las instrucciones del responsable del proceso.
                <div className="mt-4 pt-3 border-t border-[#EEF1F4] flex flex-wrap items-center justify-between gap-2 text-[10px]">
                  <span>Kaivincia Corp · Distribución interna controlada</span>
                  <span>{selectedDocument.id} · Versión 1.0</span>
                </div>
              </footer>
            </article>
          ) : (
            <div className="min-h-screen flex items-center justify-center p-8 text-center">
              <div><ListChecks className="w-12 h-12 mx-auto text-[#98A2B3] mb-3" /><h2 className="font-bold text-lg">No hay documentos coincidentes</h2><p className="text-sm text-[#667085] mt-2">Cambia el término de búsqueda para ver los manuales disponibles.</p></div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

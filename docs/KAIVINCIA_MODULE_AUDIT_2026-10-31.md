# Kaivincia Corp — Auditoría funcional de módulos, duplicidades y datos simulados
Fecha: 2026-10-31
Rama: audit/kaivincia-full-platform-review
Base protegida: eab664c88b67fd191496eb4bbfffe966438e3c29
PR: #22 (Draft; no merge ni promoción a producción)

## Alcance de esta pasada
Revisión estática contrastando rutas de `src/App.tsx`, navegación de `src/components/CRMLayout.tsx`, componentes de páginas, listeners Firestore y acciones visibles. Esta revisión identifica problemas reproducibles en el código, pero no equivale a pruebas E2E con cuentas reales ni a validar datos de producción.

## Hallazgos confirmados

### P0 — Datos privados y consultas globales
- `src/contexts/GlobalContext.tsx` abre listeners globales de `clients`, `users` y `tasks` para cualquier usuario autenticado.
- `src/pages/Dashboard.tsx` vuelve a escuchar `clients` y `users` globalmente.
- `src/pages/Clients.tsx` y `src/pages/ClientManagement.tsx` consultan `clients` sin filtro de propietario, empresa o asignación.
- `src/pages/CallCenterAdmin.tsx` lee globalmente `operadores`, `telnyx_phone_numbers` y `telnyx_sip_credentials`.
- No endurecer reglas Firestore de forma aislada: primero alinear cada consulta con el modelo de propietario/asignación/empresa y probar con Emulator Suite. Las reglas no filtran resultados de consultas.

### P1 — Módulos duplicados o con límites ambiguos
1. **Clientes / Base de Clientes:** `/crm/clients` (`Clients.tsx`) y `/crm/client-management` (`ClientManagement.tsx`) operan sobre la misma colección `clients`. Ambos tienen ficha/gestión de clientes, pero usan esquemas de campos distintos (`name/company/billingModel` frente a `companyName/contactName/paymentModel`). Esto puede producir registros incompatibles y dos lugares para mantener la misma información.
   - Decisión funcional recomendada: un único registro canónico de cliente y una experiencia integrada: lista/búsqueda/importación/upsell + ficha 360 (datos, proyectos, tareas, interacciones, visitas y facturación). Mantener permisos globales de administración separados de la visibilidad del agente.
   - Antes de migrar, mapear los campos existentes y no sobrescribir datos históricos.

2. **Dashboard / Nervous System:** `/crm/dashboard` y `/crm/nervous` se presentan como paneles ejecutivos/centros de mando con métricas solapadas. Ambos contienen datos de muestra; no son dos fuentes independientes de verdad.
   - Decisión funcional recomendada: Dashboard como inicio operativo y resumen real por rol; Nervous System sólo debe permanecer si se convierte en observabilidad real con fuentes verificables, o redirigirse/retirarse del menú. No mostrar predicciones, latencia, cifrado, ROI ni estado de sistema inventados.

3. **Sidebar legado:** `src/components/Sidebar.tsx` contiene una navegación paralela simplificada y una ruta `/crm/settings` que no existe en `App.tsx`. No se ha demostrado que esté montado; `CRMLayout.tsx` ya implementa el sidebar activo. Tratar el componente como legado y confirmar referencias antes de eliminarlo.

4. **Chat / Miembros y Roles:** dos entradas del menú llevan a `/crm/chat` y `/crm/chat?view=contacts`. No son módulos independientes; deben presentarse como vistas/tabs del mismo módulo y sincronizar la URL, no como dos productos separados.

5. **Pipeline / Marketing:** el Pipeline es un embudo de leads, pero se etiqueta como Marketing/Oportunidades y además aparece en el grupo de telemarketing. Definir Pipeline como gestión de leads y Marketing como campañas/canales/atribución; evitar duplicar la misma ruta como dos módulos.

### P1 — Datos o acciones ficticias detectados
- `src/pages/Dashboard.tsx`: feed inicial con eventos de ejemplo (TechCorp, Carlos Ruiz, alertas de chat), KPIs hardcodeados (salud 88, ROI 185, crecimiento academia 24), gráfico semanal con importes fijos y acción “Optimización IA” que sólo espera 2 segundos y añade un evento local. No es una optimización real ni una telemetría fiable.
- `src/pages/NervousSystem.tsx`: leaderboard con personas y ROI fijos, eventos/insights predefinidos, cash flow/health/growth inventados, latencia y estados animados aleatoriamente. No debe comunicar “Admin System: Active”, “99.8% Encrypted” o estados de seguridad sin fuente verificable.
- `src/pages/Clients.tsx`: declara “Mocking logic” para estadísticas de academia; además importa `GoogleGenAI` directamente en el frontend. Revisar todas las llamadas restantes para impedir exposición de claves y migrarlas al endpoint autenticado.
- `src/pages/Recruitment.tsx`: al mover un candidato a Academia muestra un alert que admite que el correo de bienvenida es una simulación. La acción debe ser sólo “cambiar etapa” hasta que exista integración real de correo/provisión; no afirmar aprobación ni envío.
- `src/pages/Pipeline.tsx`: contiene lista fija de nombres de agentes (TLMK_AGENTS). La asignación debe obtener usuarios/operadores activos y autorizados desde datos reales; si no existen, dejar la asignación sin seleccionar y explicar el motivo.
- `src/components/pipeline/MetaImportModal.tsx`: cuando el CSV no trae agente, distribuye contactos por índice entre los nombres de `tlmkList`. La importación no debe asignar arbitrariamente; usar agente seleccionado explícitamente o dejar sin asignar.
- `src/pages/CallCenterAdmin.tsx`: el botón de sincronización muestra resultado sólo en consola; debe mostrar conteo real y errores al usuario, con autorización de servidor.
- `src/pages/Clients.tsx`: importa PDF.js y SheetJS; validar versiones/advisories y procesar documentos en entorno seguro antes de reactivar importación XLSX/PDF.

### P1 — Recorridos y rutas inconsistentes
- La ruta `/crm/settings` del sidebar legado no está declarada.
- Las rutas CRM están protegidas de forma desigual: algunas usan `requirePermission`, otras sólo comparan rol alumno/admin y otras dependen del RouteGuard general. El menú no es control de seguridad.
- `/crm/clients` y `/crm/client-management` duplican responsabilidades y contratos de datos.
- El paso candidato → cliente → proyecto → tareas → facturación debe compartir identificador canónico de cliente; hoy el código mantiene estructuras distintas y necesita pruebas de conversión.
- La vista Chat/Contactos y los tabs controlados por query params deben soportar atrás/adelante del navegador.

## Catálogo funcional propuesto (sin cambiar reglas de negocio)
| Dominio | Función canónica | Módulos implicados | Estado de auditoría |
|---|---|---|---|
| CRM comercial | Capturar, asignar, contactar y convertir leads | Pipeline, Marketing, Clients | Revisar asignación y conversión |
| Clientes | Registro único + ficha 360 | Clients, ClientManagement, ClientPortal | Duplicidad confirmada |
| Actividad | Crear, asignar y cerrar tareas/citas | Tasks, Calendar, Pipeline | Aislamiento y flujo pendientes |
| Comunicación | Conversaciones y contactos | Chat | Aislamiento P0 |
| Telefonía | Softphone, números asignados, operadores y llamadas | CallSystem, CallCenterAdmin, Integrations | Seguridad P0 |
| Finanzas | Facturas, pagos, cobranza y contabilidad | Billing, Accounting, Cobranza | Separar finanzas internas y portal cliente |
| Talento | Vacantes, candidatos, empleados y nómina | Recruitment, TeamManagement, Payroll | Acciones simuladas detectadas |
| Operaciones | Proyectos, documentos, SOP y helpdesk | Projects, Drive, SOPManuals, Helpdesk | Validar enlaces y entidades |
| Dirección | KPIs y reportes basados en datos reales | Dashboard, Reports, StrategicReport | Mocks confirmados |
| Seguridad | Permisos, auditoría y telemetría verificada | SuperAdmin, SecurityCenter | Cobertura parcial |

## Orden de remediación seguro
1. Mantener `eab664c88b67fd191496eb4bbfffe966438e3c29` intacto y todos los cambios en la rama de auditoría.
2. Definir el esquema canónico de cliente y el flujo lead → cliente; preparar migración compatible y pruebas de lectura/escritura antes de consolidar pantallas.
3. Sustituir mocks por datos reales o estados explícitos “Sin datos / No conectado / DEMO”; no generar métricas ni identidades artificiales.
4. Eliminar asignaciones arbitrarias de agentes y resolverlas desde usuarios/operadores activos y sus permisos.
5. Unificar matriz de rutas y acciones con RBAC; probar URL directa, deep links, navegación y Firestore con perfiles por rol.
6. Ejecutar pruebas integradas de cada recorrido y sólo entonces decidir qué módulos se fusionan, redirigen o retiran.
7. Mantener PR #22 en Draft y producción en la base aprobada hasta que los gates de seguridad, CI y pruebas funcionales estén verdes.

## Limitaciones
No se han ejecutado sesiones E2E con usuarios de prueba, Firebase Emulator Suite, Telnyx real, Meta real ni correo real. Los hallazgos de esta pasada son inspecciones estáticas respaldadas por el código citado; no se declara que los flujos estén reparados ni que producción haya cambiado.


## Correcciones aplicadas después de la inspección
- Pipeline: las transiciones de etapa, reasignaciones y edición de cabecera sólo actualizan la interfaz después de confirmar Firestore. Si falla el guardado, se propaga el error y no se conserva un cambio local falso.
- Pipeline: la creación manual ya no inventa un ID temporal ni presenta el contacto como guardado cuando falla Firestore.
- Pipeline: importación CSV ahora usa un batch atómico (máximo 450 filas por lote); la lista local sólo se actualiza tras el commit confirmado.
- Pipeline: la cita comercial y su registro en Agenda se escriben en un mismo batch; notas de cita y feedback GPS se persisten junto con el cambio de etapa. El feedback GPS exige coordenadas.
- Pipeline: las notas ya no atribuyen por defecto la autoría a una persona fija; usan la identidad de la sesión.
- Asignación: se retiró la lista de nombres ficticios del Pipeline; las opciones disponibles se derivan de asignaciones existentes en registros CRM. No se inventan identidades.
- Importación Meta CSV: se eliminó la distribución circular por índice. Sólo se conserva una asignación explícita que coincida con una opción existente; el resto queda “Sin asignar”.
- Reclutamiento: el cambio de etapa a “Academia Kaivincia” ya no afirma que se envió un correo ni que se crearon accesos. El mensaje aclara que sólo cambió la etapa.
- Dashboard: se corrigieron dos acciones que apuntaban a la ruta inexistente `/crm/academia`; ahora apuntan a `/crm/academy-internal`. Se cambió el encabezado engañoso “Nervous System” por “Dashboard Ejecutivo”.

## Validación pendiente de estas correcciones
Los commits de corrección ya están en la rama de auditoría, pero aún no se dispone de una ejecución CI ni de un preview Vercel correspondiente al HEAD actual. Por tanto, estos cambios todavía no se declaran compilados ni validados en navegador. La producción permanece en la base aprobada.

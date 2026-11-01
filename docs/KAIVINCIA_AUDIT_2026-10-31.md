# Kaivincia Corp — Auditoría integral
Fecha: 2026-10-31
Línea base aprobada: eab664c88b67fd191496eb4bbfffe966438e3c29
Respaldo: backup/kaivincia-dashboard-logo-approved-2026-10-31

## Alcance inspeccionado en esta primera pasada
- Enrutamiento principal: src/App.tsx
- Navegación: src/components/CRMLayout.tsx y src/components/Sidebar.tsx
- Guardia de acceso: src/components/RouteGuard.tsx
- Autenticación/perfil: src/contexts/AuthContext.tsx y src/hooks/useAuth.ts
- Reglas de datos: firestore.rules
- Módulos muestreados: Dashboard, Clients, Pipeline, Tasks, CalendarView, Chat, CallSystem, CallCenterAdmin, SuperAdmin.
- Catálogo de páginas en src/pages (incluidos CRM, administración, finanzas, academia, portales, seguridad e integraciones).

## Hallazgos confirmados por inspección estática

### P0 — Seguridad y aislamiento de datos
1. `firestore.rules`: `tasks` permite read/create/update/delete a cualquier usuario autenticado. No limita lectura/edición al propietario, asignado o supervisor.
2. `clients` permite lectura global a cualquier autenticado. Las subcolecciones también permiten lectura global.
3. `leads`, `client_interactions`, `chat_messages`, `omnichannel_threads`, `voip_call_history`, `voip_providers`, `esim_profiles`, `shared_whatsapp_chats`, `appointments`, `call_dispositions`, `projects`, `invoices`, `time_logs`, `integrations`, `automation_rules`, `collaborators`, `academic_progress` y otros recursos muestran reglas amplias de acceso autenticado. Requieren modelo de acceso por empresa/propietario/asignación/rol.
4. `candidates` permite create público sin validación de campos ni protección antiabuso. Puede ser intencional para solicitudes de empleo, pero necesita validación y límites en backend.
5. La regla `users` permite a un usuario actualizar cualquier campo excepto role/status/permissions/uid; validar también email, flags de privilegio y campos de asignación para evitar escalada indirecta.

**No cambiar reglas directamente en producción** hasta mapear todos los campos reales, consultas y flujos. Firestore Rules no filtra resultados: las consultas de cliente deben coincidir con los predicados y deben probarse con Emulator Suite.

### P1 — Rutas, roles y aprobación
6. `src/App.tsx` declara muchas rutas con condiciones heterogéneas: unas bloquean sólo alumnos, otras comparan admin/superadmin y muchas no aplican permiso granular por módulo. El menú no debe ser la barrera de seguridad.
7. `RouteGuard` protege el contenedor CRM, pero no sustituye autorización por ruta/acción. Revisar estado de aprobación, usuario invitado/operador y sesiones Firebase.
8. Hay que comparar IDs de roles y módulos entre `constants/roles`, matriz RBAC en SuperAdmin, CRMLayout y rutas. No normalizar hasta documentar alias históricos y migrar datos.
9. En App hay fallback de `effectiveUserData` con rol `tlmk` y estado `active` cuando userData no está presente; verificar que no se utilice en una sesión autenticada incompleta ni permita privilegios.

### P1 — Integridad funcional / UX
10. `CallSystem.tsx` incluye una sesión de llamada de prueba generada localmente; separar con claridad demo/test frente a llamada real y evitar presentar actividad simulada como conexión del carrier.
11. `Tasks.tsx` escucha la colección completa de tareas; `CalendarView.tsx` escucha tareas y clientes completos. Además del riesgo de datos, esto puede generar sobrecarga y calendarios con elementos que el usuario no debe ver.
12. `Sidebar.tsx` parece una navegación paralela reducida y contiene ruta `/crm/settings`, que no está declarada en App; verificar si está activa o es componente legado.
13. Verificar que las pestañas controladas por query params se inicialicen y sincronicen correctamente al usar atrás/adelante del navegador. En CallSystem se observa estado local inicializado desde `tab`; validar sincronización posterior.
14. SuperAdmin muestra controles de políticas y sincronización; revisar si cada control persiste configuración real o sólo cierra modal/muestra feedback. No afirmar acciones realizadas si no se guardaron en backend.
15. Los backups `.bak_*` viven dentro de `src/pages` y `src/components`; revisar imports, riesgo de confusión y excluirlos de compilación o retirarlos sólo tras confirmar que son redundantes.

## Inventario de módulos identificados
Academia interna/externa, contabilidad, solicitudes, auditorías SGI, automatizaciones, facturación, calendario, administración call center, softphone/historial/eSIM/VoIP/omnicanal, carreras, chat, gestión de clientes, portal cliente, clientes, cobranza, comisiones, comunicaciones, dashboard, productos digitales, drive, plantillas, helpdesk, integraciones, marketing, formularios, Nervous System, operaciones, nómina, pipeline, proyectos, reclutamiento, reportes, SOP/manuales, seguridad, reportes estratégicos, blog estratégico, SuperAdmin, despliegue táctico, tareas, gestión de equipo y portal de usuario, además de B2B.

## Plan de remediación seguro
1. Construir inventario ruta → pantalla → tabs → acciones → colecciones/API → roles.
2. Definir matriz canónica rol × módulo × acción y alias históricos.
3. Añadir pruebas de autorización para cada ruta y reglas de Firestore con Emulator Suite; incluir tests negativos de acceso cruzado.
4. Corregir aislamiento de tareas/clientes/leads/chat/telefonía/finanzas con consultas compatibles y migración gradual.
5. Alinear UX: títulos y navegación, breadcrumbs, tabs con URL sincronizada, estados de carga/vacío/error, confirmaciones, feedback real y responsive.
6. Revisar módulo por módulo los formularios y acciones críticas, y marcar explícitamente datos demo.
7. Ejecutar lint, typecheck, tests y build; probar flujos con cuentas representativas de cada rol.
8. Abrir PRs pequeños por fase. Desplegar primero a preview; producción sólo tras pruebas funcionales y de seguridad.

## Limitaciones de esta pasada
Esta es una revisión estática del código fuente disponible. No equivale a ejecutar cada pestaña con usuarios reales, ni a verificar el comportamiento de Firebase/Telnyx en producción. Los puntos señalados como riesgos requieren pruebas de integración antes de cambiar políticas o lógica.


## Hallazgos adicionales — revisión de autenticación y telefonía (2026-10-31)

### P0 — Aprovisionamiento y exposición de telefonía
16. `api/telnyx-token.ts` valida que el solicitante tenga un ID token Firebase válido, pero no comprueba que el perfil `users/{uid}` esté aprobado ni que el usuario tenga un rol autorizado antes de crear/recuperar una credencial Telnyx. Si no existe `operadores/{uid}`, el endpoint crea automáticamente un operador con `activo: true`, `permiteSalientes: true` y `permiteEntrantes: true`. Esto puede convertir una cuenta autenticada sin aprobación del CRM en un usuario habilitado para obtener un JWT de telefonía.
17. `api/telnyx-numbers.ts` verifica autenticación Firebase, pero no rol ni asignación; luego devuelve la lista completa de números activos de la cuenta Telnyx. La política debe separar números asignados al agente de inventario global reservado a administradores.
18. `api/telnyx-test.ts` ejecuta la prueba de conexión sin verificar token Firebase ni rol. Aunque no devuelve la API key, permite invocar una operación administrativa del carrier sin autorización de aplicación.
19. `src/pages/CallCenterAdmin.tsx` consulta directamente las colecciones completas `operadores`, `telnyx_phone_numbers` y `telnyx_sip_credentials`. La visibilidad de la ruta en React no protege estas lecturas; las reglas deben exigir rol administrativo y restringir secretos/credenciales.
20. `api/auth/bootstrap-user.ts` repara perfiles allowlisted con `status: 'active'`, mientras `firestore.rules` define `isApproved()` sólo para `status == 'approved'`. El frontend y las reglas mantienen, por tanto, semánticas distintas de aprobación. Debe establecerse un estado canónico y una transición compatible, sin bloquear administradores legítimos.

**Acción inmediata recomendada:** antes de tocar el endpoint, definir el contrato de elegibilidad: perfil CRM existente, estado aprobado/activo canónico, rol, operador activo, asignación de caller IDs y permisos entrantes/salientes. Aplicar el mismo helper de autorización en los endpoints de token, números, sincronización y test. No crear automáticamente operadores activos para identidades sin aprobación. Añadir pruebas negativas para usuario pendiente, suspendido, agente sin asignación y usuario no autenticado.

### P1 — Inconsistencia de roles
21. `src/constants/roles.ts` reconoce `agent`, pero el modelo de `AuthContext` y la provisión de telefonía utilizan `agente`; otras rutas utilizan `tlmk`. La función `getRoleLevel('agente')` devuelve nivel 0, por lo que los helpers jerárquicos no reconocen ese rol como agente. Se requiere alias canónico retrocompatible y migración documentada.
22. `RouteGuard` permite estados `approved` y `active`, y contempla excepciones para roles privilegiados; las reglas Firestore sólo reconocen `approved`. La autorización de interfaz no debe considerarse equivalente a autorización de datos o APIs.
23. El fallback `effectiveUserData` en `App.tsx` puede construir un perfil aparente `tlmk/active` cuando falta `userData`. Aunque el guard basado en AuthContext debe impedir el acceso sin perfil, se debe eliminar esa identidad sintética para que ninguna ruta/componente pueda interpretarla como autorización.

### Limitación específica
Estos hallazgos proceden de lectura estática de los archivos `api/telnyx-token.ts`, `api/telnyx-numbers.ts`, `api/telnyx-test.ts`, `api/auth/bootstrap-user.ts`, `src/pages/CallCenterAdmin.tsx`, `src/constants/roles.ts`, `src/App.tsx` y `firestore.rules`. No se han ejecutado llamadas reales a Telnyx ni pruebas con cuentas de distintos roles.


## Hallazgos adicionales — telefonía, monitoreo y controles administrativos

24. `api/telnyx/numbers/sync.ts` valida identidad Firebase, pero no valida rol administrativo ni aprobación antes de consultar el inventario Telnyx completo y escribirlo en Firestore. Un usuario autenticado podría invocar la sincronización fuera del panel administrativo.
25. `api/telnyx-test.ts` tampoco verifica método/identidad/rol de forma suficiente: acepta POST sin validar Authorization y ejecuta `testConnection`. Debe limitarse a administradores autenticados y registrar auditoría.
26. `src/pages/CallSystem.tsx` presenta el estado fijo “Troncal Zadarma Online” y el monitor permite crear una llamada local de prueba con proveedor, duración, latencia, jitter y grabación simulados. La interfaz debe etiquetar esos valores como DEMO y derivar el estado del carrier de una comprobación real.
27. `src/pages/SecurityCenter.tsx` muestra “Protección del Ecosistema: EN LÍNEA” como estado fijo. Sus métricas usan listeners reales, pero no constituyen por sí mismas una verificación integral de seguridad.
28. En `src/pages/SuperAdmin.tsx`, los controles del modal “Políticas Globales de Sesión & Seguridad” usan selectores/checkbox locales sin estado persistido; el botón “Guardar Políticas” sólo cierra el modal y muestra feedback. El modal “Sincronización de Red & Permisos” también muestra resultados predefinidos y cierra el modal con un mensaje de éxito sin ejecutar sincronización backend. Es necesario implementar persistencia/acción real o presentarlos como prototipos deshabilitados.
29. `src/pages/CallCenterAdmin.tsx` consulta colecciones de operadores, números y credenciales; además, la sincronización invoca endpoint que sólo comprueba identidad. La protección de la página no sustituye controles en Firestore y API.

## Estado de producción verificado durante la auditoría
La consulta del proyecto Vercel `kaivinciacorp2` devolvió el deployment de producción `dpl_poPcxMcebyBGrWg99rbJCay9My3r` en estado `READY`, con alias `www.kaivinciacorp.com`, asociado al commit estable `eab664c88b67fd191496eb4bbfffe966438e3c29`. Esta verificación confirma el estado del deployment en Vercel; no sustituye pruebas funcionales de cada pantalla ni llamadas reales al carrier.


## Remediación aplicada en rama fix/secure-telnyx-authorization

Fecha: 2026-10-31. Esta fase contiene cambios propuestos; todavía no están fusionados ni desplegados.

- Añadido `server/authorization.ts`: valida ID token Firebase revocado/no revocado, existencia de perfil CRM, estado `active/approved`, rol y, cuando corresponde, operador activo.
- `api/telnyx-token.ts`: ya no crea automáticamente un operador ni habilita permisos. Exige perfil CRM autorizado y operador existente activo antes de generar JWT; sólo provisiona la credencial Telnyx para un operador ya habilitado.
- `api/telnyx-numbers.ts`: administradores pueden consultar inventario de cuenta; agentes sólo reciben números asignados a su UID en el documento de operador.
- `api/telnyx-test.ts`, `api/telnyx/config.ts`, `api/telnyx/credentials/list.ts`, `api/telnyx/credentials/create.ts` y `api/telnyx/numbers/sync.ts`: requieren rol administrativo; se limita el Connection ID al configurado en servidor para crear/probar credenciales y se agregan eventos de auditoría en operaciones administrativas.
- `src/constants/roles.ts`: alias retrocompatibles para `agente`, `tlmk`, `telemarketing`, `setter`, `closer` y `operador` como `agent`.
- Añadidas pruebas unitarias para normalización y jerarquía de roles en `src/constants/roles.test.ts`.

### Validaciones pendientes antes de producción
1. Ejecutar CI completo (lint, typecheck, tests y build) en GitHub/Vercel y corregir fallos de integración.
2. Probar con perfiles superadmin/admin/supervisor/agente aprobados, agente pendiente, suspendido y agente sin asignación de caller ID.
3. Verificar que los flujos UI que llaman a endpoints administrativos envían token y que los roles que los usan corresponden a la política nueva.
4. Verificar configuración CORS para dominios de preview/producción y política de secretos/credenciales en Firestore.
5. Revisar endpoints restantes de eSIM, SIP, webhooks, configuración de carrier y reglas Firestore antes de declarar completada la seguridad VoIP.

No se ha realizado deploy de esta rama. No se deben considerar las correcciones activas hasta que PR sea revisada, CI pase y un preview sea probado.


## Remediación incremental — fase 1 (2026-11-01)

Rama: `audit/kaivincia-full-platform-review`  
PR: #22 (Draft)  
Base protegida: `eab664c88b67fd191496eb4bbfffe966438e3c29`

### Cambios implementados en código
- `src/constants/roles.ts`: añade `normalizeRole()` para mapear alias históricos `sales/ventas/tlmk/telemarketing/setter/closer/agente/operador` a `agent`, sin migrar ni sobrescribir perfiles existentes.
- `src/components/RouteGuard.tsx`: aplica normalización y bloquea estados explícitos `rejected/suspended/disabled/blocked`; mantiene compatibilidad de perfiles activos y SuperAdmin legacy.
- `src/App.tsx`: elimina el fallback que inventaba un perfil operativo `tlmk/active` cuando faltaba el perfil CRM; ahora falla cerrado con `none/pending`.
- `src/components/CRMLayout.tsx`: usa la normalización de roles para resolver correctamente la navegación de cuentas históricas.
- `src/pages/CallSystem.tsx`: sólo `admin/superadmin` ven paneles administrativos Telnyx/Meta; la pestaña se sincroniza con query params y browser history; el acceso por URL a tabs administrativas se corrige a Monitor para roles no autorizados; se elimina el estado fijo “Zadarma Online” y las sesiones locales llevan aviso DEMO.
- `src/pages/SuperAdmin.tsx`: modificar permisos de módulo ya no activa ni aprueba implícitamente al usuario; el feedback distingue el registro de invitación del envío real de correo y la eliminación del perfil Firestore de la eliminación de la cuenta Firebase; si falla el guardado de la matriz se restaura el estado local confirmado.
- `src/constants/roles.test.ts`: pruebas unitarias de alias históricos, jerarquía y límites de privilegios.

### Validación y limitaciones
- Los cambios están versionados en la rama independiente y aparecen en PR #22; no se han fusionado ni desplegado.
- Aún no hay un resultado CI asociado al HEAD de esta fase; no afirmar typecheck/tests/build aprobados hasta que corran.
- No se endurecieron reglas Firestore porque las consultas actuales de Tasks/Calendar/Clients escuchan colecciones amplias; primero hay que adaptar consultas y probar aislamiento con Emulator para evitar bloquear procesos legítimos.
- Sigue pendiente conectar la matriz RBAC persistida con cada ruta y acción; hoy la existencia de la matriz no implica que esté aplicada globalmente.
- Las políticas globales y sincronización de red en SuperAdmin deben pasar a persistencia/operación real o mostrarse como no disponibles; todavía no se declaran funcionales.

### Siguiente lote de trabajo
1. Crear y ejecutar gates CI reproducibles (typecheck, unit tests, build; lint reportado por separado por deuda heredada).
2. Inventariar y alinear ruta → módulo → permiso → endpoint → colección para las 100+ rutas/pantallas.
3. Aislar primero Tasks/Calendar/Clients con Emulator y queries owner/assigned; después leads/chat/omnicanal/finanzas/telefonía.
4. Corregir las acciones de demostración del panel SuperAdmin y verificar persistencia.
5. Pruebas end-to-end por rol, incluyendo deep links y acciones prohibidas.

**No desplegar a producción hasta completar las pruebas de seguridad y funcionales.**


## Auditoría funcional — fase 2: CRM Core y comunicación (2026-11-01)

### P0 — Lecturas globales incompatibles con privacidad por asignación
- `src/contexts/GlobalContext.tsx`: mantiene listeners globales de `clients`, `users` y `tasks` para cualquier usuario autenticado. La regla de `users` permite leer sólo el propio perfil o admin; por tanto, los consumidores no administrativos pueden recibir permission-denied y perder directorio/contexto. La colección `notifications` existe en el contexto pero nunca se carga.
- `src/pages/Tasks.tsx`: escucha todas las tareas, todos los usuarios, proyectos y clientes. No filtra por `assignedTo`, `createdBy`, `assignedClients` ni permisos de rol. Expone datos en memoria de la UI y el modelo actual de reglas permite lectura/escritura global de tareas.
- `src/pages/CalendarView.tsx`: escucha todas las tareas, clientes y citas. El calendario puede presentar actividades de otras personas/clientes; además crea tareas sin `createdBy`, `projectId` ni prioridad, mientras el formulario de Tasks exige proyecto al crear desde su propia pantalla.
- `src/pages/Chat.tsx`: carga toda la colección `chat_messages` y filtra los mensajes privados sólo en el navegador. La regla Firestore actual permite lectura a cualquier autenticado; por tanto, el filtrado visual no protege conversaciones privadas.
- `src/pages/Clients.tsx`: escucha todos los clientes, colaboradores y prospectos. La detección de upsell lee globalmente `academic_progress` y `users`; la ficha de cliente consulta facturas/proyectos y progreso académico. El acceso a datos financieros/académicos debe depender de rol y cliente asignado.

**Riesgo:** el control visual de menú no limita la lectura de datos. El aislamiento debe aplicarse simultáneamente en reglas y consultas compatibles; no cambiar sólo las reglas porque Firestore no filtra resultados y podría romper listeners.

### P1 — Pipeline mostraba datos de demostración como leads reales
- `src/pages/Pipeline.tsx` escuchaba `clients`, pero si no había registros insertaba cuatro leads ficticios con nombres, teléfonos, importes, agentes y notas inventados. La tarjeta ofrecía llamar/WhatsApp a esos teléfonos y las acciones de edición intentaban actualizar documentos que no existían.
- Remediación aplicada en esta fase: se elimina el fallback de leads ficticios; no se inventan teléfonos, importes ni responsables; el pipeline muestra el estado vacío real y deshabilita llamada/WhatsApp cuando el teléfono no existe.
- Se elimina duplicación de grupos de navegación entre Ventas y Ecosistema de Clientes para roles gestor/CEO/SuperAdmin.

### P1 — Coherencia funcional de tareas y calendario
- La creación de tareas desde calendario no cumple el mismo contrato de datos que la creación desde Tasks. Antes de unificar el formulario hay que decidir si `projectId` es obligatorio o si las tareas personales pueden existir sin proyecto, y documentar el contrato en tipos y reglas.
- Los contadores y notificaciones del contexto global no son fiables mientras `notifications` no tenga una fuente real y las tareas no estén limitadas por asignación.

### Próximas correcciones seguras
1. Definir scope por usuario: admin/superadmin global; manager/supervisor según equipo asignado; agente/colaborador sólo asignaciones propias; cliente sólo portal propio.
2. Migrar GlobalContext y Tasks/Calendar/Clients a consultas por scope con índices requeridos.
3. Rediseñar Chat para separar grupos internos, mensajes privados por participante y conversaciones de cliente por asignación; añadir pruebas de lectura cruzada.
4. Añadir Firebase Emulator Suite y tests positivos/negativos para reglas por colección.
5. Normalizar contrato de Task y flujo de creación desde calendario.

**No se han cambiado reglas Firestore en esta fase.** Las consultas y estructuras de datos deben migrarse antes para no bloquear operaciones existentes.


### Correcciones adicionales de fase 2 — panel de administración y pipeline
- `src/pages/Pipeline.tsx`: eliminados leads de muestra que aparecían como clientes reales al estar vacía la colección; teléfono, responsable, campaña, importe y health score ya no se inventan; llamada y WhatsApp se deshabilitan si no existe teléfono.
- `src/components/CRMLayout.tsx`: quitados grupos de navegación duplicados para gestor/CEO/SuperAdmin.
- `src/pages/SuperAdmin.tsx`: las políticas de sesión/2FA sin persistencia están deshabilitadas y explicadas; la sincronización global no simula éxito y muestra estado no verificado; la asignación de clientes aclara que todavía no aplica aislamiento en Firestore; invitaciones indican que sólo se registra una solicitud, sin envío de correo; eliminación aclara que borra el perfil CRM, no la cuenta Firebase; logs usan UID/email del actor autenticado y ya no simulan IP localhost; errores al guardar permisos restauran el estado anterior.
- Etiquetas “Guardado en Firestore” y “Marco de referencia ISO 27001 / SOC 2 (sin certificación)” sustituyen afirmaciones de sincronización/certificación no demostradas.

### Validación automatizada
- Añadido `.github/workflows/quality-gates.yml`: TypeScript, unit tests y build son gates; lint se informa sin bloquear por deuda heredada.
- El run de GitHub Actions para el HEAD `be505870756b3cdec536640e4475b4a2ab2399ab` quedó en cola/pending al momento de esta revisión; todavía no hay resultado de jobs que permita afirmar tests aprobados.
- Preview Vercel anterior del commit `a0098de8a2b0f311c2f6a62099646384b18d965c` terminó READY. El preview posterior del commit `d5ba5142c1a88ebce587aaeb2bc970ad5833596c` seguía BUILDING; no equivale al HEAD actual y debe repetirse tras estabilizar el código.
- Producción sigue fuera de alcance y no ha recibido alias ni promoción desde esta rama.


## Auditoría de rutas y navegación — inventario App.tsx

Se identificaron **53 declaraciones Route** en `src/App.tsx` (incluye rutas públicas, B2B, rutas CRM y alias). No son 100+ rutas; la complejidad adicional está en pestañas internas y acciones de cada módulo.

### Hallazgo P0: RBAC de navegación no aplicado uniformemente
- La mayoría de las rutas CRM sólo redirigen si `role === 'alumno'`; eso no equivale a comprobar permisos de módulo.
- Rutas como `tasks`, `calendar`, `chat`, `cobranza`, `billing`, `academy-internal`, `academy-external`, `digital-products`, `manuales`, `client-portal` y `user-portal` no tienen un control de rol/permisos específico en la definición de ruta.
- `clients`, `pipeline`, `accounting`, `payroll`, `recruitment`, `reports`, `projects`, `commissions`, `drive`, `audits`, `marketing`, `operations` y varias más sólo bloquean al alumno; un usuario autenticado de otro rol puede intentar abrirlas por URL directa.
- Las rutas `call-center`, `superadmin`, `appearance` y `security` sí tienen restricciones explícitas, aunque algunas comparan roles crudos y no consultan la matriz RBAC por módulo.
- La matriz de SuperAdmin define 12 permission IDs (`view_financial_dashboard`, `accounting_gps`, `client_base_global`, `client_base_assigned`, `academy_management`, `voip_calls`, `recruitment_payroll`, `telephony_config`, `automations_engine`, `security_center`, `export_databases`, `delete_records`), pero `App.tsx` no consume esa matriz para decidir acceso a rutas.

### Remediación aplicada
- El redirect de entrada a CRM ahora normaliza roles históricos; las cuentas `sales/ventas/tlmk/telemarketing/setter/closer/agente/operador` llegan a Pipeline como `agent`, sin editar su documento de usuario.

### Pendiente antes de aplicar route-level RBAC
- Definir un mapa validado `route → permission ID → scope de datos → acciones permitidas` con el propietario del negocio.
- Aplicar matriz con override por usuario y fallback por rol; denegar por defecto sólo después de comprobar las rutas legítimas de cada perfil.
- Corregir primero las consultas globales de Firestore; un guard de ruta no evita que un módulo abierto lea datos fuera de asignación.
- Añadir tests de deep link para los 11 roles y pruebas de acceso a endpoints/Firestore; no basarse sólo en que el menú oculte enlaces.


## Remediación de RBAC y administración financiera — fase 3

### Matriz RBAC aplicada a rutas sensibles
- `src/App.tsx` escucha `settings/rbac_matrix` y espera su primera respuesta antes de renderizar CRM; si la lectura falla, usa defaults documentados para perfiles legacy.
- Nuevo resolver `hasEffectivePermission()` con precedencia: override explícito por usuario → matriz persistida por rol → lista de roles legacy como fallback. El rol histórico `sales` sigue resolviendo la matriz almacenada bajo `sales` aunque la navegación lo normalice a `agent`.
- Rutas ahora protegidas por permission ID: `cobranza/view_financial_dashboard`, `call-center/telephony_config`, `automations/automations_engine`, `integrations/telephony_config`, `calls/voip_calls`, `recruitment/team/payroll/recruitment_payroll`, `accounting/billing/accounting_gps`, `client-management/client_base_global`, `reports/export_databases`, `security/security_center`.
- `CRMLayout` recibe el mismo resolver y filtra los enlaces con las mismas políticas; se eliminan grupos vacíos, se corrige el menú de admin y se evitan enlaces duplicados. Facturación global ya no aparece para alumnos/usuarios sin permiso.
- `RouteGuard` y el gate superior de `App.tsx` comparten el criterio para estados rechazados/suspendidos/deshabilitados/bloqueados y la excepción legacy de SuperAdmin pendiente.
- Pruebas unitarias ampliadas para precedencia de permisos, deny/allow por usuario, matriz guardada y alias `sales → agent`.

### Datos financieros y seguridad operativa
- `Accounting.tsx`: métricas estáticas identificadas como DEMO; selector de moneda deshabilitado porque no cambia los valores ni está conectado a un ledger.
- `Payroll.tsx`: importes/ROI/bonos y agentes de ejemplo identificados como DEMO; exportación CSV deshabilitada hasta conectar nómina real.
- `SecurityCenter.tsx`: cambia la afirmación “EN LÍNEA” por “Telemetría PARCIAL”; distingue sesiones marcadas `isActive` de conexiones verificadas y el campo `mfaEnrolled` de una validación real de MFA en Firebase Auth. El query de auditoría queda limitado a timestamps de las últimas 24 horas.

### Límites que siguen abiertos
- Las rutas `clients`, `pipeline`, `tasks`, `calendar` y `chat` siguen pendientes de scope de datos. No se declara protegida la información por ocultar enlaces; GlobalContext y varios listeners consultan colecciones globales.
- La colección `chat_messages` sigue siendo el riesgo de privacidad más alto: mensajes privados filtrados en frontend y regla Firestore demasiado amplia. Requiere separar mensajes de grupo, privados y clientes y probar acceso cruzado.
- `Billing` y otras pantallas financieras necesitan prueba funcional end-to-end con documentos reales, reglas y notificaciones; el permiso de ruta no garantiza por sí solo el aislamiento de sus consultas.
- La matriz global puede modificarse en caliente; todavía falta testear cada rol real con URL directa y llamadas a Firestore/API. No declarar la auditoría de permisos terminada.

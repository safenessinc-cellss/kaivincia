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

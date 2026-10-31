export type ManualStep = { title: string; detail: string };
export type ManualSection = {
  heading: string;
  intro?: string;
  bullets?: string[];
  steps?: ManualStep[];
  checklist?: string[];
  warning?: string;
};
export type ManualDocument = {
  id: string;
  title: string;
  summary: string;
  owner: string;
  audience: string;
  reviewCycle: string;
  status: 'Vigente como guía base' | 'Requiere validación del responsable';
  sections: ManualSection[];
};
export type ManualDepartment = {
  id: string;
  name: string;
  description: string;
  documents: ManualDocument[];
};

const doc = (
  id: string, title: string, summary: string, owner: string, audience: string,
  sections: ManualSection[], status: ManualDocument['status'] = 'Vigente como guía base'
): ManualDocument => ({
  id, title, summary, owner, audience, reviewCycle: 'Cada 6 meses o ante cambios del proceso',
  status, sections
});

export const MANUAL_DEPARTMENTS: ManualDepartment[] = [
  {
    id: 'KV-PRO-ADM', name: 'Administración & RR. HH.',
    description: 'Gobierno, personas, accesos, documentos y controles administrativos.',
    documents: [
      doc('KV-PRO-ADM-01', 'Manual general de gobierno y operación CRM',
        'Marco de uso responsable de Kaivincia CRM, desde el acceso hasta el cierre y la mejora de procesos.',
        'Dirección de Operaciones', 'Todos los perfiles autorizados', [
          { heading: '1. Propósito y alcance', bullets: [
            'Establecer una forma consistente de trabajar en los módulos de Kaivincia CRM.',
            'La información registrada en el módulo de origen es la referencia operativa; los paneles e informes son vistas de consulta.',
            'Este manual no concede permisos: cada usuario solo puede ejecutar acciones habilitadas para su cuenta.'
          ]},
          { heading: '2. Acceso y sesión', steps: [
            { title: 'Ingresar con cuenta autorizada', detail: 'Utilizar el método de autenticación habilitado por la organización. No compartir contraseñas, códigos ni sesiones.' },
            { title: 'Comprobar perfil y estado', detail: 'Verificar que el usuario esté aprobado y que el rol mostrado corresponda a sus funciones. Si falta un módulo, solicitar revisión de permisos.' },
            { title: 'Proteger la sesión', detail: 'Bloquear el equipo al ausentarse y cerrar sesión en dispositivos compartidos.' }
          ]},
          { heading: '3. Ciclo de trabajo', steps: [
            { title: 'Planificar', detail: 'Definir objetivo, registro implicado, responsable y resultado esperado.' },
            { title: 'Autorizar', detail: 'Comprobar permisos, aprobación y nivel de confidencialidad antes de consultar, exportar o modificar datos.' },
            { title: 'Ejecutar', detail: 'Trabajar en el módulo de origen y completar los campos obligatorios disponibles.' },
            { title: 'Verificar', detail: 'Volver a abrir el registro y confirmar que el cambio quedó guardado.' },
            { title: 'Cerrar y documentar', detail: 'Registrar resultado, siguiente acción, responsable y fecha cuando corresponda.' }
          ]},
          { heading: '4. Reglas de calidad y trazabilidad', bullets: [
            'No crear registros duplicados: buscar por nombre, correo, teléfono o identificador antes de crear.',
            'No alterar datos para hacer coincidir un indicador; corregir el registro fuente y dejar evidencia.',
            'Toda acción relevante debe permitir identificar quién actuó, cuándo, sobre qué registro y cuál fue el resultado.',
            'No asumir que una pantalla abierta o un mensaje visual equivalen a persistencia: confirmar el dato guardado.'
          ]},
          { heading: '5. Escalamiento', steps: [
            { title: 'Detener la acción insegura', detail: 'Ante acceso indebido, exposición de datos o posible pérdida de información, no continuar ni intentar eludir controles.' },
            { title: 'Registrar incidencia', detail: 'Abrir ticket con módulo, fecha/hora y zona horaria, usuario, registro afectado, pasos reproducibles y mensaje de error. Evitar incluir secretos.' },
            { title: 'Asignar y verificar', detail: 'El responsable técnico analiza la causa; el solicitante confirma la solución en el módulo afectado.' }
          ]},
          { heading: '6. Control de cierre diario', checklist: [
            'Revisar tareas vencidas y registros sin responsable.',
            'Documentar llamadas, reuniones y conversaciones relevantes.',
            'Comprobar incidencias críticas y solicitudes de acceso pendientes.',
            'Verificar que los documentos usados sean la versión vigente.',
            'Escalar inconsistencias, fallos de integración o accesos anómalos.'
          ]}
        ]),
      doc('KV-PRO-ADM-02', 'Administración de usuarios, roles y permisos',
        'Procedimiento para alta, autorización, modificación, revisión y baja de usuarios, respetando el modelo RBAC.',
        'Superadministración / RR. HH.', 'Superadministradores, administradores y responsables de equipo', [
          { heading: '1. Principios de autorización', bullets: [
            'El rol determina el marco general de acceso; los permisos granulares y las asignaciones pueden limitarlo aún más.',
            'Aplicar mínimo privilegio: conceder solo los módulos y acciones necesarios para el puesto.',
            'El registro de una cuenta no implica aprobación automática ni acceso a todas las áreas.',
            'La eliminación de usuarios se reserva al propietario/superadministrador autorizado conforme a la política vigente.'
          ]},
          { heading: '2. Alta y autorización', steps: [
            { title: 'Recibir solicitud', detail: 'RR. HH. o el responsable confirma identidad corporativa, puesto, departamento, supervisor y fecha de inicio.' },
            { title: 'Revisar cuenta registrada', detail: 'Localizar la solicitud en el panel de usuarios pendientes. No crear cuentas duplicadas para sortear una aprobación.' },
            { title: 'Definir alcance', detail: 'Seleccionar rol y permisos requeridos, equipos, cartera y restricciones de datos.' },
            { title: 'Aprobar y verificar', detail: 'El administrador autorizado aplica la aprobación. El nuevo usuario vuelve a iniciar sesión y confirma únicamente los módulos asignados.' }
          ]},
          { heading: '3. Cambios y revisión periódica', bullets: [
            'Los cambios de puesto requieren revisión de rol, permisos, equipo, cartera y números de salida asignados.',
            'Revisar accesos al menos trimestralmente y al producirse una desvinculación o cambio de función.',
            'Retirar accesos que ya no sean necesarios y documentar quién autorizó el cambio.'
          ]},
          { heading: '4. Incidencias de acceso', checklist: [
            'Confirmar que la cuenta autenticada sea la correcta.',
            'Comprobar estado aprobado y rol asignado.',
            'Verificar permisos granulares y asignación al equipo.',
            'Registrar módulo, acción denegada y código de error.',
            'Escalar sin modificar manualmente roles en el navegador ni compartir credenciales.'
          ]},
          { heading: '5. Evidencia mínima', bullets: [
            'Identificador del usuario y correo corporativo.',
            'Solicitante, aprobador y fecha/hora de autorización.',
            'Rol, permisos, alcance de datos y motivo.',
            'Fecha de revisión o baja y confirmación de ejecución.'
          ]}
        ]),
      doc('KV-PRO-ADM-03', 'Gestión documental, versiones y publicación SOP',
        'Reglas para redactar, revisar, aprobar, publicar y retirar procedimientos internos.',
        'Calidad documental', 'Autores, revisores, aprobadores y usuarios', [
          { heading: '1. Estructura obligatoria', bullets: [
            'Cada documento debe incluir código, título, versión, propietario, aprobador, fecha de vigencia y próxima revisión.',
            'Describir propósito, alcance, roles, requisitos previos, pasos, controles, excepciones y evidencias.',
            'Distinguir procedimiento vigente, borrador y contenido pendiente de validación.'
          ]},
          { heading: '2. Flujo de control', steps: [
            { title: 'Redacción', detail: 'El propietario describe el proceso real y cita los módulos o formularios implicados.' },
            { title: 'Revisión funcional', detail: 'Un usuario competente ejecuta los pasos en un entorno autorizado y señala diferencias.' },
            { title: 'Aprobación', detail: 'El responsable del proceso valida exactitud, riesgos y responsabilidades.' },
            { title: 'Publicación', detail: 'Publicar la versión aprobada y comunicar el cambio a los perfiles afectados.' },
            { title: 'Retirada', detail: 'Marcar versiones anteriores como obsoletas y evitar que sigan apareciendo como instrucciones vigentes.' }
          ]},
          { heading: '3. Gestión de cambios', checklist: [
            'Cambio de pantalla, ruta o campo documentado.',
            'Cambio de rol, permiso o aprobación revisado.',
            'Integración, API o proveedor externo actualizado.',
            'Capturas y ejemplos sin datos personales reales.',
            'Versión, fecha efectiva y responsable actualizados.'
          ]}
        ])
    ]
  },
  {
    id: 'KV-PRO-VOIP', name: 'Voz & Telecomunicaciones',
    description: 'Uso del softphone, proveedores, números de salida, calidad de llamada y soporte.',
    documents: [
      doc('KV-PRO-VOIP-01', 'Manual del operador VoIP & WebRTC · Telnyx / SIP',
        'Procedimiento del agente para realizar, recibir y documentar llamadas mediante el softphone habilitado.',
        'Operaciones de Contact Center', 'Agentes, supervisores y soporte VoIP', [
          { heading: '1. Alcance y proveedor', bullets: [
            'El punto de operación es CRM > Llamadas / Call Center > Softphone, según la navegación habilitada para el perfil.',
            'Utilizar exclusivamente el proveedor y la extensión asignados en la sesión. La presencia de una opción no confirma que el proveedor esté conectado.',
            'Telnyx WebRTC requiere autenticación y un token temporal emitido por el backend. La alternativa SIP depende de que la extensión y el proveedor estén configurados.'
          ], warning: 'No asumir que Telnyx y Zadarma están activos simultáneamente. Confirmar proveedor, estado de conexión y asignación visible antes de operar.'},
          { heading: '2. Preparación', checklist: [
            'Cuenta aprobada y permiso de llamadas habilitado.',
            'Proveedor asignado visible y estado conectado/registrado.',
            'Navegador con permiso de micrófono y dispositivo correcto.',
            'Conexión estable y sin errores de autenticación.',
            'Número de destino revisado en formato internacional.'
          ]},
          { heading: '3. Llamada saliente', steps: [
            { title: 'Abrir el softphone', detail: 'Entrar en el módulo de llamadas y comprobar que el panel termina de cargar.' },
            { title: 'Validar conexión', detail: 'Confirmar el estado real de WebRTC o registro SIP. Si hay error de token, 401, 403 o desconexión, no repetir llamadas a ciegas.' },
            { title: 'Seleccionar Caller ID autorizado', detail: 'Elegir un número de salida que aparezca asignado al usuario/campaña. Los agentes solo deben usar sus números asignados; la supervisión autorizada puede gestionar el conjunto permitido.' },
            { title: 'Confirmar destino y horario', detail: 'Revisar país, número, consentimiento/base legal y hora local del contacto. Si el CRM no muestra una validación horaria fiable, comprobarla con la política aprobada antes de llamar.' },
            { title: 'Realizar y documentar', detail: 'Iniciar la llamada, registrar resultado y próxima acción. Confirmar que el evento aparece en el historial.' }
          ]},
          { heading: '4. Caller ID y privacidad', bullets: [
            'El número que el destinatario ve depende del proveedor, la configuración de presentación, la verificación del número y las reglas del operador de destino.',
            'La selección en pantalla por sí sola no demuestra qué Caller ID fue presentado en la red telefónica.',
            'Para comprobarlo, realizar una llamada de prueba autorizada a un teléfono de control y registrar el número mostrado, hora, destino, proveedor y Call ID.',
            'No usar números ajenos ni intentar falsificar identificadores de llamada.'
          ]},
          { heading: '5. Cierre y calidad', checklist: [
            'Resultado de la llamada registrado.',
            'Notas objetivas y profesionales guardadas.',
            'Próxima acción y fecha asignadas cuando proceda.',
            'Incidencia de audio o conexión reportada con Call ID.',
            'Grabación/transcripción solo se considera disponible si la plataforma y la política aplicable lo confirman.'
          ]},
          { heading: '6. Diagnóstico inicial', bullets: [
            'Sin micrófono: revisar permisos del navegador y dispositivo de entrada.',
            'No conecta: revisar estado del proveedor y sesión; informar errores HTTP del token al soporte.',
            '403: verificar autorización del usuario y acceso del backend al recurso.',
            'El destinatario ve otro número: revisar Caller ID autorizado, configuración del proveedor y registros de la llamada.'
          ]}
        ], 'Requiere validación del responsable'),
      doc('KV-PRO-VOIP-02', 'Administración de telefonía, números y extensiones',
        'Control de inventario, asignación, cambios y pruebas de números telefónicos y credenciales SIP/WebRTC.',
        'Administrador VoIP', 'Superadministradores, administradores y soporte técnico', [
          { heading: '1. Inventario', bullets: [
            'Mantener registro de número, país, proveedor, tipo, estado, campaña, responsable y fecha de asignación.',
            'Las credenciales y tokens son secretos: no deben aparecer en manuales, tickets, capturas ni repositorios.',
            'La sincronización de números desde un proveedor debe verificarse comparando el total y los registros importados.'
          ]},
          { heading: '2. Asignación de Caller ID', steps: [
            { title: 'Validar titularidad y uso', detail: 'Confirmar que el número pertenece a la organización o está autorizado contractualmente.' },
            { title: 'Asignar por función', detail: 'Vincular el número a equipo, campaña y usuarios concretos; evitar asignaciones globales innecesarias.' },
            { title: 'Aplicar permisos', detail: 'Limitar la selección del agente a sus números autorizados. Los administradores gestionan el inventario según su rol.' },
            { title: 'Probar presentación', detail: 'Realizar llamada controlada y comprobar el Caller ID recibido por el terminal de prueba.' }
          ]},
          { heading: '3. Alta o cambio de proveedor', checklist: [
            'Contrato y cuenta de proveedor confirmados.',
            'Credenciales guardadas en el gestor/entorno seguro correspondiente.',
            'Webhook y backend configurados y validados.',
            'Token temporal generado correctamente, cuando aplique.',
            'Llamada entrante y saliente probadas.',
            'Plan de reversión y responsable de soporte definidos.'
          ]},
          { heading: '4. Gestión de incidentes', bullets: [
            'No compartir API keys, SIP passwords, tokens ni capturas que los expongan.',
            'Revocar o rotar credenciales ante sospecha de exposición.',
            'Registrar proveedor, número, extensión, Call ID, fecha/hora y respuesta técnica.',
            'No declarar una integración operativa hasta completar pruebas de extremo a extremo.'
          ]}
        ], 'Requiere validación del responsable')
    ]
  },
  {
    id: 'KV-PRO-VTA', name: 'Ventas / Setters',
    description: 'Prospección, calificación, agenda, pipeline y seguimiento comercial.',
    documents: [
      doc('KV-PRO-VTA-01', 'Prospección y calificación B2B',
        'Método para identificar cuentas, iniciar conversaciones y registrar oportunidades sin generar datos ficticios.',
        'Dirección Comercial', 'Setters, SDR y responsables de ventas', [
          { heading: '1. Preparación de la cuenta', checklist: [
            'Verificar que la empresa y el contacto no existan ya en CRM.',
            'Identificar sector, ubicación, tamaño y posible necesidad con fuente verificable.',
            'Confirmar que el canal de contacto está permitido y respetar exclusiones.',
            'Definir objetivo concreto del primer contacto.'
          ]},
          { heading: '2. Primer contacto', steps: [
            { title: 'Personalizar', detail: 'Usar información profesional relevante y verificable; no fingir una relación previa.' },
            { title: 'Presentarse', detail: 'Indicar nombre, empresa y motivo real del contacto de forma breve.' },
            { title: 'Explorar necesidad', detail: 'Hacer preguntas abiertas sobre situación, impacto, urgencia y proceso de decisión.' },
            { title: 'Acordar siguiente paso', detail: 'Solicitar permiso para continuar o agendar una conversación con el especialista.' }
          ]},
          { heading: '3. Calificación', bullets: [
            'Registrar necesidad, impacto, urgencia, autoridad/interlocutores, presupuesto cuando se conozca y plazo.',
            'Separar hechos confirmados de hipótesis del setter.',
            'No asignar porcentajes de probabilidad o presupuesto sin criterio comercial aprobado.',
            'Si no hay encaje, registrar motivo y aplicar el estado definido por el proceso.'
          ]},
          { heading: '4. Registro en CRM', checklist: [
            'Empresa/contacto y fuente registrados.',
            'Propietario de oportunidad asignado.',
            'Etapa del pipeline coherente con la conversación.',
            'Notas objetivas y resultado del contacto guardados.',
            'Próxima acción con fecha y responsable.'
          ]}
        ]),
      doc('KV-PRO-VTA-02', 'Pipeline, agenda y seguimiento omnicanal',
        'Reglas para mantener oportunidades actualizadas y coordinar reuniones y seguimientos.',
        'Gerencia Comercial', 'Setters, account executives y supervisores', [
          { heading: '1. Gestión del pipeline', steps: [
            { title: 'Crear o localizar oportunidad', detail: 'Buscar registros existentes y vincular la oportunidad con la cuenta/contacto correcto.' },
            { title: 'Actualizar etapa', detail: 'Mover la oportunidad solo cuando se cumplan los criterios de entrada y salida de la etapa.' },
            { title: 'Registrar valor y fecha', detail: 'Usar valores confirmados; marcar estimaciones como estimadas y mantener moneda y periodo.' },
            { title: 'Revisar bloqueos', detail: 'Documentar objeciones, dependencia, competidor o decisión pendiente sin alterar el historial.' }
          ]},
          { heading: '2. Agenda de reuniones', checklist: [
            'Confirmar nombre y cargo de los participantes.',
            'Acordar fecha, hora y zona horaria explícitas.',
            'Registrar objetivo, agenda y datos de contacto.',
            'Enviar confirmación por el canal autorizado.',
            'Actualizar el CRM ante cancelación o reprogramación.'
          ]},
          { heading: '3. Seguimiento omnicanal', bullets: [
            'Registrar interacciones relevantes en la ficha o línea de tiempo del contacto.',
            'Evitar mensajes repetitivos, contradictorios o fuera de la preferencia del contacto.',
            'Respetar solicitudes de no contacto y políticas de retención.',
            'Toda tarea debe tener responsable, vencimiento y resultado esperado.'
          ]},
          { heading: '4. Revisión del supervisor', checklist: [
            'Oportunidades sin propietario identificadas.',
            'Oportunidades sin próxima acción revisadas.',
            'Reuniones próximas confirmadas.',
            'Etapas estancadas y motivos documentados.',
            'Muestra de registros revisada por calidad.'
          ]}
        ])
    ]
  },
  {
    id: 'KV-PRO-FIELD', name: 'Despliegue Táctico',
    description: 'Planificación de visitas, relevamientos técnicos, seguridad en sitio y entrega.',
    documents: [
      doc('KV-PRO-FIELD-01', 'Planificación y ejecución de visitas técnicas',
        'Procedimiento para preparar, autorizar, ejecutar y cerrar una visita en instalaciones del cliente.',
        'Operaciones de Campo', 'Consultores, técnicos y responsables de proyecto', [
          { heading: '1. Autorización previa', checklist: [
            'Orden de trabajo y alcance aprobados.',
            'Contacto del cliente y acceso al sitio confirmados.',
            'Fecha, hora, zona horaria y ubicación verificadas.',
            'Riesgos, permisos y requisitos de seguridad revisados.',
            'Equipo, herramientas y personal asignados.'
          ]},
          { heading: '2. Llegada al sitio', steps: [
            { title: 'Identificarse y registrarse', detail: 'Seguir el protocolo de recepción y acompañamiento del cliente.' },
            { title: 'Charla de seguridad', detail: 'Recibir instrucciones EHS, rutas de evacuación, zonas restringidas y permisos aplicables.' },
            { title: 'Confirmar alcance', detail: 'Acordar con el responsable del cliente las actividades autorizadas y límites de intervención.' }
          ]},
          { heading: '3. Ejecución controlada', bullets: [
            'No intervenir sistemas, equipos, cableado o energía fuera del alcance aprobado.',
            'Aplicar procedimientos de bloqueo/etiquetado y permisos del cliente cuando correspondan.',
            'No manipular fibra activa ni equipos energizados sin competencia, autorización y protección adecuadas.',
            'Fotografiar únicamente con autorización y evitar información personal o sensible.'
          ]},
          { heading: '4. Cierre', checklist: [
            'Actividades realizadas comparadas con el alcance.',
            'Hallazgos, limitaciones y riesgos documentados.',
            'Materiales y cambios registrados.',
            'Evidencias almacenadas en repositorio autorizado.',
            'Aceptación o pendientes confirmados con el cliente.'
          ]}
        ], 'Requiere validación del responsable'),
      doc('KV-PRO-FIELD-02', 'Relevamiento de redes e infraestructura',
        'Guía para levantar información de redes, Wi-Fi y activos sin modificar la infraestructura del cliente sin autorización.',
        'Líder Técnico de Campo', 'Ingenieros de redes y técnicos autorizados', [
          { heading: '1. Alcance y seguridad', bullets: [
            'Obtener autorización escrita para pruebas, escaneos, fotografías y acceso a armarios técnicos.',
            'Definir ventanas de mantenimiento, sistemas excluidos y límites de carga de las pruebas.',
            'No ejecutar escaneos intrusivos, pruebas de penetración ni cambios de configuración si no están incluidos en el permiso.'
          ]},
          { heading: '2. Levantamiento', steps: [
            { title: 'Inventario visual', detail: 'Registrar racks, patch panels, equipos, etiquetado, ventilación y condiciones físicas visibles.' },
            { title: 'Topología', detail: 'Documentar enlaces, segmentos, ubicaciones y dependencias confirmadas por el cliente.' },
            { title: 'Wi-Fi', detail: 'Medir cobertura e interferencia con herramientas autorizadas y parámetros acordados.' },
            { title: 'Rendimiento', detail: 'Ejecutar pruebas de throughput, latencia, jitter y pérdida únicamente en la ventana y endpoints aprobados.' }
          ]},
          { heading: '3. Informe técnico', checklist: [
            'Alcance, fecha, ubicación y participantes.',
            'Metodología y herramientas utilizadas.',
            'Inventario con modelo y serie cuando esté permitido.',
            'Resultados medidos y condiciones de prueba.',
            'Hallazgos separados de recomendaciones.',
            'Riesgos, prioridades, responsables y próximos pasos.'
          ]}
        ], 'Requiere validación del responsable')
    ]
  },
  {
    id: 'KV-PRO-CRM', name: 'Plataforma CRM · Manual por módulo',
    description: 'Instrucciones transversales para clientes, tareas, proyectos, documentos, informes e incidencias.',
    documents: [
      doc('KV-PRO-CRM-01', 'Clientes, contactos y oportunidades',
        'Uso consistente de registros comerciales y sus relaciones dentro del CRM.',
        'Propietarios de módulo / Operaciones', 'Agentes comerciales, setters y supervisores', [
          { heading: '1. Búsqueda y creación', steps: [
            { title: 'Buscar antes de crear', detail: 'Consultar por nombre, correo, teléfono y otros identificadores disponibles.' },
            { title: 'Validar datos', detail: 'Normalizar teléfono con prefijo internacional y revisar correo, empresa y fuente.' },
            { title: 'Crear con propietario', detail: 'Asignar responsable y completar los campos requeridos por el formulario.' }
          ]},
          { heading: '2. Actualización y seguimiento', bullets: [
            'Editar el registro fuente, no una copia exportada.',
            'Registrar cambios significativos con nota y motivo cuando el módulo lo permita.',
            'Mantener estado, propietario y próxima acción alineados con la situación real.',
            'No eliminar registros para corregir errores: utilizar el procedimiento de corrección o solicitar apoyo.'
          ]},
          { heading: '3. Control de calidad', checklist: [
            'Sin duplicados conocidos.',
            'Datos de contacto verificados.',
            'Origen/fuente registrado.',
            'Propietario y estado correctos.',
            'Última interacción y siguiente paso documentados.'
          ]}
        ]),
      doc('KV-PRO-CRM-02', 'Tareas, proyectos, Drive e informes',
        'Procedimientos para gestionar compromisos, entregables, documentos e indicadores con trazabilidad.',
        'Operaciones / Propietarios de cada módulo', 'Todos los responsables de tareas y proyectos', [
          { heading: '1. Tareas', bullets: [
            'Crear una tarea con acción concreta, resultado esperado, responsable, prioridad y vencimiento.',
            'Vincularla a cliente, oportunidad o proyecto cuando exista relación.',
            'Actualizar estado y bloqueos; cerrar únicamente cuando el resultado esté entregado o documentado.'
          ]},
          { heading: '2. Proyectos', steps: [
            { title: 'Definir ficha', detail: 'Registrar objetivo, alcance, patrocinador, responsable y criterios de aceptación.' },
            { title: 'Planificar', detail: 'Desglosar hitos, tareas, dependencias, recursos y fechas.' },
            { title: 'Controlar', detail: 'Actualizar avance con evidencia; registrar riesgos, decisiones y cambios de alcance.' },
            { title: 'Cerrar', detail: 'Obtener aceptación, documentar pendientes y archivar entregables.' }
          ]},
          { heading: '3. Drive y documentos', checklist: [
            'Nombre descriptivo, categoría y nivel de confidencialidad seleccionados.',
            'Propietario, versión y fecha registrados.',
            'Revisión y aprobación completadas antes de publicar como oficial.',
            'Acceso compartido solo con personas autorizadas.',
            'Versiones obsoletas identificadas y no utilizadas como referencia vigente.'
          ]},
          { heading: '4. Informes y analítica', bullets: [
            'Definir periodo, filtros, población, moneda y zona horaria antes de exportar.',
            'Contrastar totales con los módulos transaccionales de origen.',
            'Distinguir datos observados, estimaciones e hipótesis.',
            'Indicar fecha de corte, autor, fuente y limitaciones del informe.'
          ]},
          { heading: '5. Incidencias y soporte', checklist: [
            'Descripción clara y pasos para reproducir.',
            'Módulo, usuario, fecha/hora y zona horaria.',
            'Identificador del registro o Call ID cuando aplique.',
            'Captura sin secretos ni datos personales innecesarios.',
            'Impacto, frecuencia y resultado esperado.'
          ]}
        ])
    ]
  }
];

export const MANUAL_DOCUMENTS = MANUAL_DEPARTMENTS.flatMap(department => department.documents);

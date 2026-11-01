# Kaivincia Corp

Plataforma interna de gestión comercial, operaciones y atención al cliente de Kaivincia Corp.

## Stack

- React y TypeScript
- Vite
- Firebase Authentication y Cloud Firestore
- Vercel para despliegues
- Integraciones de telefonía y servicios de IA, sujetas a la configuración de cada entorno

## Requisitos

- Node.js compatible con la versión definida por el proyecto
- Acceso al proyecto Firebase correspondiente
- Variables de entorno configuradas para los servicios que se utilicen

## Desarrollo local

1. Instalar dependencias:

   `npm install`

2. Configurar las variables de entorno requeridas en `.env.local`. No incluir claves privadas en el código del cliente ni subir secretos al repositorio.

3. Iniciar el servidor:

   `npm run dev`

## Validación

Antes de integrar cambios, ejecutar los scripts de comprobación disponibles en `package.json`, incluyendo TypeScript, pruebas y compilación cuando estén configurados.

## Seguridad y datos

Los datos mostrados por la aplicación deben proceder de fuentes autorizadas y verificables. Las funciones no conectadas a servicios reales deben identificarse como no disponibles o pendientes de configuración; no deben presentar datos de demostración como actividad real.

Las funciones asistidas por IA son auxiliares y no sustituyen la validación humana ni los controles de acceso.
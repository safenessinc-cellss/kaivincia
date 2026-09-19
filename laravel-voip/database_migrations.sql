-- =========================================================================
-- MASTER SQL MIGRATIONS - TELECOM VoIP INTEGRATION (ZADARMA CORE)
-- Kaivincia Corp - Arquitecto de Sistemas Senior
-- Postgres/MySQL compatible standard schemas
-- =========================================================================

-- 1. TABLE: Configuración SIP de los Agentes de Ventas
-- Enlaza a los usuarios del CRM con sus extensiones SIP creadas en Zadarma.
CREATE TABLE IF NOT EXISTS agent_sip_configs (
    id BIGSERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE, -- Relación directa con la tabla 'users' o 'agents' del CRM
    sip_username VARCHAR(50) NOT NULL UNIQUE, -- Extensión de Zadarma (ej: "432100" o "12345")
    sip_password VARCHAR(255) NOT NULL, -- Clave de la extensión (encriptada en producción o variable de entorno)
    caller_id_number VARCHAR(20) DEFAULT NULL, -- Número DID asignado al agente para llamadas salientes (ej: "12135627140")
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_agent_sip_configs_username ON agent_sip_configs(sip_username);
CREATE INDEX idx_agent_sip_configs_user ON agent_sip_configs(user_id);


-- 2. TABLE: Historial Centralizado de Llamadas IP (call_logs)
-- Registra todas las interacciones de voz, costos, métricas de red, estados y audios.
CREATE TABLE IF NOT EXISTS call_logs (
    id BIGSERIAL PRIMARY KEY,
    pbx_call_id VARCHAR(100) NOT NULL UNIQUE, -- ID único generado por Zadarma (ej: "1625624102.32451")
    direction VARCHAR(20) NOT NULL, -- "incoming" (entrante) o "outbound" (saliente)
    caller_number VARCHAR(30) NOT NULL, -- Número que originó la llamada (teléfono del cliente o del DID)
    called_number VARCHAR(30) NOT NULL, -- Número receptor (teléfono del cliente o del DID)
    sip_extension VARCHAR(50) DEFAULT NULL, -- Extensión del agente involucrado (ej: "432100")
    agent_id INT DEFAULT NULL, -- Relación directa con el ID de usuario del agente (CRM user_id)
    lead_id INT DEFAULT NULL, -- Relación directa con el Lead o Cliente del CRM
    status VARCHAR(30) NOT NULL DEFAULT 'ringing', -- ringing, connected, completed, failed, missed, busy
    disposition VARCHAR(30) DEFAULT NULL, -- answered, busy, no answer, cancel, failed
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP DEFAULT NULL,
    duration_seconds INT DEFAULT 0, -- Duración real de la conversación en segundos
    cost DECIMAL(10, 5) DEFAULT 0.00000, -- Costo de la llamada devuelto por Zadarma o calculado por la tarifa ($0.012/min)
    status_code VARCHAR(20) DEFAULT NULL, -- Código SIP de terminación (ej: "200 OK", "486 Busy")
    is_recorded BOOLEAN DEFAULT FALSE, -- Indica si la llamada cuenta con grabación de voz activa
    recording_url VARCHAR(1024) DEFAULT NULL, -- Enlace web directo al archivo de grabación de audio .mp3
    user_agent VARCHAR(255) DEFAULT NULL, -- WebRTC, IP-Phone, ZadarmaApp
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_call_logs_pbx_call ON call_logs(pbx_call_id);
CREATE INDEX idx_call_logs_agent ON call_logs(agent_id);
CREATE INDEX idx_call_logs_lead ON call_logs(lead_id);
CREATE INDEX idx_call_logs_direction ON call_logs(direction);
CREATE INDEX idx_call_logs_status ON call_logs(status);
CREATE INDEX idx_call_logs_start ON call_logs(start_time);


-- 3. TABLE: Horarios y Zonas Horarias por Código de Área (area_code_schedules)
-- Almacena las reglas de zona horaria por código de área y sus restricciones geográficas de marcación.
CREATE TABLE IF NOT EXISTS area_code_schedules (
    id SERIAL PRIMARY KEY,
    area_code VARCHAR(5) NOT NULL UNIQUE, -- Código de área telefónico de 3 dígitos (ej: "213")
    state VARCHAR(100) NOT NULL, -- Estado (ej: "California")
    city VARCHAR(100) NOT NULL, -- Ciudad (ej: "Los Ángeles")
    iana_timezone VARCHAR(100) NOT NULL, -- Zona horaria (ej: "America/Los_Angeles")
    timezone_label VARCHAR(20) NOT NULL, -- Etiqueta descriptiva (ej: "PT")
    safe_start_time TIME DEFAULT '09:00:00', -- Inicio del horario seguro
    safe_end_time TIME DEFAULT '20:00:00', -- Cierre del horario seguro
    is_restricted BOOLEAN DEFAULT FALSE, -- Si tiene restricciones gubernamentales o feriados especiales
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_area_code_schedules_code ON area_code_schedules(area_code);


-- =========================================================================
-- SEED DATA DE COBERTURA INICIAL (EE.UU. COBERTURA KAIVINCIA)
-- =========================================================================

INSERT INTO area_code_schedules (area_code, state, city, iana_timezone, timezone_label, safe_start_time, safe_end_time)
VALUES 
('213', 'California', 'Los Ángeles Downtown', 'America/Los_Angeles', 'PT', '09:00:00', '20:00:00'),
('562', 'California', 'Long Beach', 'America/Los_Angeles', 'PT', '09:00:00', '20:00:00'),
('714', 'California', 'Anaheim / Orange County', 'America/Los_Angeles', 'PT', '09:00:00', '20:00:00'),
('909', 'California', 'San Bernardino', 'America/Los_Angeles', 'PT', '09:00:00', '20:00:00'),
('951', 'California', 'Riverside', 'America/Los_Angeles', 'PT', '09:00:00', '20:00:00'),
('323', 'California', 'Los Ángeles Este/Oeste', 'America/Los_Angeles', 'PT', '09:00:00', '20:00:00'),
('720', 'Colorado', 'Denver', 'America/Denver', 'MT', '09:00:00', '20:00:00'),
('631', 'New York', 'Long Island / Suffolk County', 'America/New_York', 'ET', '09:00:00', '20:00:00'),
('856', 'New Jersey', 'Camden / Cherry Hill', 'America/New_York', 'ET', '09:00:00', '20:00:00')
ON CONFLICT (area_code) DO NOTHING;

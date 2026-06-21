-- Tactical Airspace Management System (רוק״ק) - Database Schema
-- Database: PostgreSQL + PostGIS (Spatial Extensions)

-- Enable PostGIS extension for spatial queries (polygons, lines, points)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. ENUMS DEFINITIONS

-- Roles in the system
CREATE TYPE user_role_enum AS ENUM (
    'ROKAQ_OFFICER',
    'HQ_OPERATOR',
    'DIVISION_VIEWER',
    'FIELD_OPERATOR'
);

-- Operator status
CREATE TYPE operator_status_enum AS ENUM (
    'ACTIVE',
    'SUSPENDED'
);

-- Drone status
CREATE TYPE drone_status_enum AS ENUM (
    'READY',
    'MAINTENANCE',
    'LOST',
    'DECOMMISSIONED'
);

-- Flight Request status
CREATE TYPE flight_request_status_enum AS ENUM (
    'DRAFT',
    'PENDING_REVIEW',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);

-- Airspace Zone type
CREATE TYPE airspace_zone_type_enum AS ENUM (
    'CORRIDOR',
    'NFZ',
    'RESTRICTED_ZONE'
);

-- Active Flight status
CREATE TYPE active_flight_status_enum AS ENUM (
    'ACTIVE',
    'COMMS_LOSS',
    'ANOMALOUS',
    'COMPLETED'
);

-- Sensor type
CREATE TYPE sensor_type_enum AS ENUM (
    'RADAR',
    'RF_FINDER',
    'OPTICAL',
    'EXTERNAL_SYSTEM'
);

-- IFF Classification status
CREATE TYPE iff_status_enum AS ENUM (
    'BLUE_CERTAIN',
    'BLUE_SUSPICIOUS',
    'BLUE_ANOMALOUS',
    'UNIDENTIFIED',
    'RED_SUSPICIOUS',
    'RED_CERTAIN',
    'CONFLICTING'
);

-- Incident/Event status
CREATE TYPE incident_status_enum AS ENUM (
    'OPENED',
    'ACTIVE_TIGER',
    'ACTIVE_HAMMER',
    'RESOLVED'
);

-- Incident resolution type
CREATE TYPE incident_resolution_enum AS ENUM (
    'NEUTRALIZED',
    'CONFIRMED_FRIEND',
    'EXITED_AIRSPACE'
);

-- Spectrum/Jamming source type
CREATE TYPE spectrum_source_enum AS ENUM (
    'FRIENDLY',
    'HOSTILE'
);

-- Spectrum severity level
CREATE TYPE spectrum_severity_enum AS ENUM (
    'HIGH',
    'MEDIUM'
);

-- Audit log action type
CREATE TYPE audit_action_enum AS ENUM (
    'FLIGHT_APPROVED',
    'FLIGHT_REJECTED',
    'TIGER_DECLARED',
    'HAMMER_DECLARED',
    'POLYGON_CREATED',
    'SPECTRUM_ZONE_UPDATED'
);

-- 2. TABLES DEFINITIONS

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role user_role_enum NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID,
    updated_by UUID
);

-- Units table
CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    parent_unit_id UUID REFERENCES units(id) ON DELETE SET NULL,
    unit_code VARCHAR(50) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Operator Profile table (1:1 with User, linked to Unit)
CREATE TABLE operator_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    status operator_status_enum DEFAULT 'ACTIVE' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Drones table
CREATE TABLE drones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    model VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(100) NOT NULL,
    owner_unit_id UUID NOT NULL REFERENCES units(id) ON DELETE RESTRICT,
    control_frequency NUMERIC(5,3) NOT NULL, -- GHz, e.g., 2.400
    video_frequency NUMERIC(5,3) NOT NULL,   -- GHz, e.g., 5.800
    status drone_status_enum DEFAULT 'READY' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Flight Requests table
CREATE TABLE flight_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    drone_id UUID NOT NULL REFERENCES drones(id) ON DELETE RESTRICT,
    route GEOMETRY(LineStringZ, 4326) NOT NULL, -- 3D LineString using WGS84 coordinates
    min_altitude_agl NUMERIC(6,2) NOT NULL,    -- AGL height in meters
    max_altitude_agl NUMERIC(6,2) NOT NULL,    -- AGL height in meters
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    status flight_request_status_enum DEFAULT 'PENDING_REVIEW' NOT NULL,
    notes TEXT,
    reviewer_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    CONSTRAINT chk_times CHECK (start_time < end_time),
    CONSTRAINT chk_altitudes CHECK (min_altitude_agl <= max_altitude_agl)
);

-- Airspace Zones table (Polygons)
CREATE TABLE airspace_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    geometry GEOMETRY(Polygon, 4326) NOT NULL, -- 2D spatial polygon
    floor_altitude NUMERIC(6,2) NOT NULL,       -- meters
    ceiling_altitude NUMERIC(6,2) NOT NULL,     -- meters
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    type airspace_zone_type_enum NOT NULL,
    flight_request_id UUID REFERENCES flight_requests(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    CONSTRAINT chk_zone_times CHECK (start_time < end_time),
    CONSTRAINT chk_zone_altitudes CHECK (floor_altitude <= ceiling_altitude)
);

-- Active Flights table (Telemetry Tracking sessions)
CREATE TABLE active_flights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flight_request_id UUID UNIQUE NOT NULL REFERENCES flight_requests(id) ON DELETE RESTRICT,
    drone_id UUID NOT NULL REFERENCES drones(id) ON DELETE RESTRICT,
    actual_start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    status active_flight_status_enum DEFAULT 'ACTIVE' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Sensor Detections table
CREATE TABLE sensor_detections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sensor_type sensor_type_enum NOT NULL,
    target_track_id VARCHAR(100) NOT NULL,
    coordinate GEOMETRY(PointZ, 4326) NOT NULL, -- 3D coordinate (Lat, Lng, Alt MSL)
    velocity_vector JSONB NOT NULL,            -- e.g. {"heading": 120.5, "speed_mps": 15.2}
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Identification Events table (IFF)
CREATE TABLE identification_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_track_id VARCHAR(100) NOT NULL,
    current_iff_status iff_status_enum DEFAULT 'UNIDENTIFIED' NOT NULL,
    certainty_level NUMERIC(3,2) DEFAULT 0.50 NOT NULL,
    reporter_user_id UUID REFERENCES users(id),
    status incident_status_enum DEFAULT 'OPENED' NOT NULL,
    resolution incident_resolution_enum,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    CONSTRAINT chk_certainty CHECK (certainty_level >= 0.00 AND certainty_level <= 1.00)
);

-- Spectrum Layers table (Jamming areas)
CREATE TABLE spectrum_layers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(150) NOT NULL,
    geometry GEOMETRY(Polygon, 4326) NOT NULL,
    blocked_frequencies JSONB NOT NULL, -- Array of ranges: [{"min": 2.400, "max": 2.485}]
    source spectrum_source_enum NOT NULL,
    severity spectrum_severity_enum NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    CONSTRAINT chk_spectrum_times CHECK (start_time < end_time)
);

-- Air Hammer Events table (active engagements/jamming fields)
CREATE TABLE air_hammer_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    incident_id UUID NOT NULL REFERENCES identification_events(id) ON DELETE RESTRICT,
    target_track_id VARCHAR(100) NOT NULL,
    affected_area GEOMETRY(Polygon, 4326) NOT NULL,
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    terminated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    target_unit_ids UUID[] DEFAULT '{}'::UUID[] NOT NULL, -- empty array means broadcast to all
    geometry GEOMETRY(Geometry, 4326),                    -- Point, Line, or Polygon representing alert area
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Heartbeat / Telemetry log table (high-frequency)
-- Note: In production, this can be partitioned or kept in TimescaleDB/Redis.
CREATE TABLE ping_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    active_flight_id UUID NOT NULL REFERENCES active_flights(id) ON DELETE CASCADE,
    coordinate GEOMETRY(PointZ, 4326) NOT NULL, -- Lat, Lng, Alt MSL
    altitude_agl NUMERIC(6,2) NOT NULL,
    heading NUMERIC(5,2) NOT NULL,
    speed NUMERIC(5,2) NOT NULL,
    battery_pct INT NOT NULL,
    signal_strength_dbm INT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Audit Logs table (for compliance & post-event debriefing)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_type audit_action_enum NOT NULL,
    performed_by UUID NOT NULL REFERENCES users(id),
    entity_name VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    previous_state JSONB,
    new_state JSONB,
    ip_address VARCHAR(45) NOT NULL, -- Supports IPv4 and IPv6
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. SPATIAL & PERFORMANCE INDEXING

-- Indexing for spatial lookups (PostGIS GIST indexes)
CREATE INDEX idx_flight_requests_route ON flight_requests USING GIST(route);
CREATE INDEX idx_airspace_zones_geometry ON airspace_zones USING GIST(geometry);
CREATE INDEX idx_sensor_detections_coord ON sensor_detections USING GIST(coordinate);
CREATE INDEX idx_spectrum_layers_geom ON spectrum_layers USING GIST(geometry);
CREATE INDEX idx_air_hammer_area ON air_hammer_events USING GIST(affected_area);
CREATE INDEX idx_ping_statuses_coord ON ping_statuses USING GIST(coordinate);
CREATE INDEX idx_alerts_geom ON alerts USING GIST(geometry);

-- B-Tree Indexing for standard foreign key query paths & filtering
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_operator_profiles_user ON operator_profiles(user_id);
CREATE INDEX idx_flight_requests_status ON flight_requests(status);
CREATE INDEX idx_airspace_zones_times ON airspace_zones(start_time, end_time);
CREATE INDEX idx_active_flights_status ON active_flights(status);
CREATE INDEX idx_identification_events_track ON identification_events(target_track_id);
CREATE INDEX idx_identification_events_status ON identification_events(status);
CREATE INDEX idx_ping_statuses_flight_time ON ping_statuses(active_flight_id, timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action_type, created_at DESC);

-- 4. DATABASE TRIGGERS FOR TIMESTAMP UPDATES

-- Auto update updated_at helper function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach update triggers to relevant tables
CREATE TRIGGER update_users_modtime BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_units_modtime BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_operator_profiles_modtime BEFORE UPDATE ON operator_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_drones_modtime BEFORE UPDATE ON drones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_flight_requests_modtime BEFORE UPDATE ON flight_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_airspace_zones_modtime BEFORE UPDATE ON airspace_zones FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_active_flights_modtime BEFORE UPDATE ON active_flights FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_identification_events_modtime BEFORE UPDATE ON identification_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_spectrum_layers_modtime BEFORE UPDATE ON spectrum_layers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_air_hammer_events_modtime BEFORE UPDATE ON air_hammer_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

export type UserRole = 
  | 'ADMIN'
  | 'MANUFACTURER'
  | 'MAINTENANCE_TECHNICIAN'
  | 'INSPECTOR'
  | 'VIEWER';

export interface User {
  id: number;
  uuid: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface Aircraft {
  id: number;
  aircraft_uuid: string;
  registration_number: string;
  model: string;
  manufacturer: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AircraftWithComponents {
  id: number;
  aircraft_uuid: string;
  registration_number: string;
  model: string;
  manufacturer: string;
  status: string;
  created_at: string;
  updated_at: string;
  components: Component[];
}

export interface Component {
  id: number;
  component_uuid: string;
  aircraft_id: number | null;
  aircraft_registration?: string | null;
  serial_number: string;
  component_type: string;
  manufacturer: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface ComponentTag {
  id: number;
  component_id: number;
  technology: 'NFC' | 'UHF_RFID';
  identifier: string;
  security_type: string;
  tamper_status: 'INTACT' | 'TAMPERED' | 'UNKNOWN';
  registered_at: string;
  updated_at: string;
}

export interface MaintenanceRecord {
  id: number;
  component_id: number;
  technician_id: number;
  technician_name: string;
  maintenance_type: string;
  description: string;
  parts_replaced: string | null;
  inspection_result: 'PASSED' | 'FAILED' | 'WARNING';
  record_hash: string;
  created_at: string;
}

export interface VerificationChecks {
  nfc_authentication: boolean;
  component_binding: boolean;
  tamper_status: boolean;
  blockchain_integrity: boolean;
}

export interface VerificationComponentInfo {
  id: string;
  aircraft: string;
  serial_number: string;
}

export interface VerificationResponse {
  verified: boolean;
  status: 'AUTHENTIC' | 'SUSPICIOUS' | 'INVALID';
  component?: VerificationComponentInfo | null;
  checks: VerificationChecks;
  failure_reason?: string | null;
}

export interface VerificationLog {
  id: number;
  component_id: number | null;
  tag_id: number | null;
  authentication_result: boolean;
  component_binding_result: boolean;
  tamper_result: boolean;
  blockchain_result: boolean;
  final_result: 'AUTHENTIC' | 'SUSPICIOUS' | 'INVALID';
  failure_reason: string | null;
  created_at: string;
}

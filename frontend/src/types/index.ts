export type UserRole =
  | 'SUPER_ADMIN'
  | 'COMPANY_ADMIN'
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
  /** Null only for the platform Super Admin — every other user belongs to one company. */
  company_id: number | null;
  created_at: string;
}

export interface Company {
  id: number;
  uuid: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CompanySummary extends Company {
  user_count: number;
  aircraft_count: number;
  component_count: number;
  maintenance_count: number;
  verification_count: number;
}

export interface MaintenanceResultCount {
  inspection_result: string;
  count: number;
}

export interface UserWorkCount {
  user_id: number;
  user_name: string;
  maintenance_count: number;
}

export interface WorkAnalytics {
  company_id: number;
  total_users: number;
  total_aircraft: number;
  total_components: number;
  total_maintenance_records: number;
  total_verifications: number;
  verifications_passed: number;
  verifications_failed: number;
  maintenance_by_result: MaintenanceResultCount[];
  records_by_user: UserWorkCount[];
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

// Same as MaintenanceRecord, but for the company-wide listing rather than
// a single already-known component's history — carries the component's
// serial number/type and a technician name that can legitimately be null
// (the join is a LEFT JOIN) so the UI can identify each row on its own.
export interface MaintenanceRecordWithComponent {
  id: number;
  component_id: number;
  component_serial_number: string | null;
  component_type: string | null;
  technician_id: number;
  technician_name: string | null;
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

// Same as VerificationLog, but for the company-wide log stream — carries
// the scanned component's serial number/type (both nullable: the log's
// own component_id is nullable, and the join is a LEFT JOIN) so each row
// can identify itself without a separate lookup per component.
export interface VerificationLogWithComponent {
  id: number;
  component_id: number | null;
  component_serial_number: string | null;
  component_type: string | null;
  tag_id: number | null;
  authentication_result: boolean;
  component_binding_result: boolean;
  tamper_result: boolean;
  blockchain_result: boolean;
  final_result: 'AUTHENTIC' | 'SUSPICIOUS' | 'INVALID';
  failure_reason: string | null;
  created_at: string;
}

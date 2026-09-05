export type UserRole =
  | "SUPER_ADMIN"
  | "COMPANY_ADMIN"
  | "MANUFACTURER"
  | "MAINTENANCE_TECHNICIAN"
  | "INSPECTOR"
  | "VIEWER";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  company_id: number | null;
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
}

export interface Aircraft {
  id: number;
  aircraft_uuid: string;
  registration_number: string;
  model: string;
  manufacturer: string;
  status: string;
}

export interface MaintenanceRecord {
  id: number;
  component_id: number;
  technician_name: string;
  maintenance_type: string;
  description: string;
  parts_replaced: string | null;
  inspection_result: "PASSED" | "FAILED" | "WARNING";
  record_hash: string;
  created_at: string;
}

export interface VerificationResponse {
  verified: boolean;
  status: "AUTHENTIC" | "SUSPICIOUS" | "INVALID";
  component?: { id: string; aircraft: string; serial_number: string } | null;
  checks: {
    nfc_authentication: boolean;
    component_binding: boolean;
    tamper_status: boolean;
    blockchain_integrity: boolean;
  };
  failure_reason?: string | null;
}

export interface Analytics {
  total_users: number;
  total_aircraft: number;
  total_components: number;
  total_maintenance_records: number;
  total_verifications: number;
  verifications_passed: number;
  verifications_failed: number;
}

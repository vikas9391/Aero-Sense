import axios from 'axios';
import {
  Aircraft,
  AircraftWithComponents,
  Component,
  ComponentTag,
  MaintenanceRecord,
  User,
  VerificationLog,
  VerificationResponse,
} from '../types';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aircraft_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await api.post<{ success: boolean; token: string; user: User }>('/auth/login', {
      email,
      password,
    });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get<User>('/auth/me');
    return res.data;
  },
};

export const aircraftApi = {
  list: async () => {
    const res = await api.get<Aircraft[]>('/aircraft');
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<AircraftWithComponents>(`/aircraft/${id}`);
    return res.data;
  },
  create: async (data: { registration_number: string; model: string; manufacturer: string; status?: string }) => {
    const res = await api.post<Aircraft>('/aircraft', data);
    return res.data;
  },
};

export const componentsApi = {
  list: async () => {
    const res = await api.get<Component[]>('/components');
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<Component>(`/components/${id}`);
    return res.data;
  },
  create: async (data: { aircraft_id?: number | null; serial_number: string; component_type: string; manufacturer: string; status?: string }) => {
    const res = await api.post<Component>('/components', data);
    return res.data;
  },
  getHistory: async (id: number) => {
    const res = await api.get<MaintenanceRecord[]>(`/components/${id}/history`);
    return res.data;
  },
  getVerifications: async (id: number) => {
    const res = await api.get<VerificationLog[]>(`/components/${id}/verification`);
    return res.data;
  },
};

export const tagsApi = {
  register: async (data: { component_id: number; technology: string; identifier: string; security_type?: string }) => {
    const res = await api.post<ComponentTag>('/tags/register', data);
    return res.data;
  },
  getById: async (id: number) => {
    const res = await api.get<ComponentTag>(`/tags/${id}`);
    return res.data;
  },
};

export const maintenanceApi = {
  create: async (data: { component_id: number; maintenance_type: string; description: string; parts_replaced?: string; inspection_result: string }) => {
    const res = await api.post<MaintenanceRecord>('/maintenance', data);
    return res.data;
  },
};

export const verificationApi = {
  verifyNfc: async (data: { tag_identifier: string; payload?: string; simulate_scenario?: string }) => {
    const res = await api.post<VerificationResponse>('/verification/nfc', data);
    return res.data;
  },
  verifyBlockchain: async (record_id: number) => {
    const res = await api.post<{ verified: boolean; record_id: number; db_hash: string; blockchain_hash: string; match_status: string }>('/blockchain/verify', { record_id });
    return res.data;
  },
};

export default api;

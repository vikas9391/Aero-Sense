import axios from 'axios';
import { Aircraft, AircraftWithComponents, Company, CompanySummary, Component, ComponentTag, MaintenanceRecord, User, UserProfile, UserRole, UserStatus, VerificationLog, VerificationResponse, WorkAnalytics } from '../types';
import { emitToast } from '../context/ToastContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://aero-sense-backend-0y3l.onrender.com/api';
const api = axios.create({ baseURL: API_BASE, headers: { 'Content-Type': 'application/json' } });
api.interceptors.request.use((config) => { const token = localStorage.getItem('aircraft_auth_token'); if (token) config.headers.Authorization = `Bearer ${token}`; return config; });
api.interceptors.response.use((response) => response, (error) => { if (error.response?.status === 401 && !error.config?.url?.endsWith('/auth/me')) { const hadToken = !!localStorage.getItem('aircraft_auth_token'); localStorage.removeItem('aircraft_auth_token'); if (hadToken && window.location.pathname !== '/login') { emitToast('Your session has expired. Please sign in again.', 'warning'); window.location.assign('/login'); } } return Promise.reject(error); });

export const usersApi = {
  list: async () => (await api.get<User[]>('/users')).data,
  create: async (data: { name: string; email: string; password: string; role: string }) => (await api.post<User>('/users', data)).data,
  getProfile: async (id: number) => (await api.get<UserProfile>(`/users/${id}`)).data,
  updateStatus: async (id: number, status: UserStatus) => (await api.put<User>(`/users/${id}/status`, { status })).data,
  updateRole: async (id: number, role: UserRole) => (await api.put<User>(`/users/${id}/role`, { role })).data,
  remove: async (id: number) => (await api.delete<User>(`/users/${id}`)).data,
};
export const authApi = {
  login: async (companyName: string, email: string, password: string) => (await api.post<{ success: boolean; token: string; user: User }>('/auth/login', { company_name: companyName, email, password })).data,
  demoSuperAdminLogin: async () => (await api.post<{ success: boolean; token: string; user: User }>('/auth/demo-super-admin')).data,
  getMe: async () => (await api.get<User>('/auth/me')).data,
  changePassword: async (currentPassword: string, newPassword: string) => (await api.put<User>('/auth/change-password', { current_password: currentPassword, new_password: newPassword })).data,
};
export const companiesApi = { list: async () => (await api.get<CompanySummary[]>('/companies')).data, getById: async (id: number) => (await api.get<CompanySummary>(`/companies/${id}`)).data, create: async (data: { name: string; slug?: string }) => (await api.post<Company>('/companies', data)).data, createAdmin: async (companyId: number, data: { name: string; email: string; password: string }) => (await api.post<User>(`/companies/${companyId}/admins`, data)).data, getAnalytics: async (id: number) => (await api.get<WorkAnalytics>(`/companies/${id}/analytics`)).data, listUsers: async (id: number) => (await api.get<User[]>(`/companies/${id}/users`)).data, updateStatus: async (id: number, status: 'ACTIVE' | 'SUSPENDED') => (await api.put<Company>(`/companies/${id}/status`, { status })).data };
export const analyticsApi = { getOverview: async () => (await api.get<WorkAnalytics>('/analytics/overview')).data };
export const aircraftApi = { list: async () => (await api.get<Aircraft[]>('/aircraft')).data, getById: async (id: number) => (await api.get<AircraftWithComponents>(`/aircraft/${id}`)).data, create: async (data: { registration_number: string; model: string; manufacturer: string; status?: string }) => (await api.post<Aircraft>('/aircraft', data)).data };
export const componentsApi = { list: async () => (await api.get<Component[]>('/components')).data, getById: async (id: number) => (await api.get<Component>(`/components/${id}`)).data, create: async (data: { aircraft_id?: number | null; serial_number: string; component_type: string; manufacturer: string; status?: string }) => (await api.post<Component>('/components', data)).data, getHistory: async (id: number) => (await api.get<MaintenanceRecord[]>(`/components/${id}/history`)).data, getVerifications: async (id: number) => (await api.get<VerificationLog[]>(`/components/${id}/verification`)).data };
export const tagsApi = { register: async (data: { component_id: number; technology: string; identifier: string; security_type?: string }) => (await api.post<ComponentTag>('/tags/register', data)).data, getById: async (id: number) => (await api.get<ComponentTag>(`/tags/${id}`)).data };
export const maintenanceApi = { create: async (data: { component_id: number; maintenance_type: string; description: string; parts_replaced?: string; inspection_result: string }) => (await api.post<MaintenanceRecord>('/maintenance', data)).data, listAll: async () => (await api.get<MaintenanceRecord[]>('/maintenance')).data };
export const verificationApi = { verifyNfc: async (data: { tag_identifier: string; payload?: string; simulate_scenario?: string }) => (await api.post<VerificationResponse>('/verification/nfc', data)).data, verifyBlockchain: async (record_id: number) => (await api.post<{ verified: boolean; record_id: number; db_hash: string; blockchain_hash: string; match_status: string }>('/blockchain/verify', { record_id })).data, listLogs: async () => (await api.get<VerificationLog[]>('/verification/logs')).data };
export default api;

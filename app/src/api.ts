import axios from "axios";
import * as SecureStore from "expo-secure-store";

export const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:8080/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync("aero_sense_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    if (error.response?.status === 401) {
      await SecureStore.deleteItemAsync("aero_sense_token");
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (company_name: string, email: string, password: string) =>
    (await api.post("/auth/login", { company_name, email, password })).data,
  me: async () => (await api.get("/auth/me")).data,
};

export const analyticsApi = {
  overview: async () => (await api.get("/analytics/overview")).data,
};

export const aircraftApi = {
  list: async () => (await api.get("/aircraft")).data,
  get: async (id: number) => (await api.get(`/aircraft/${id}`)).data,
};

export const componentsApi = {
  list: async () => (await api.get("/components")).data,
  get: async (id: number) => (await api.get(`/components/${id}`)).data,
  history: async (id: number) => (await api.get(`/components/${id}/history`)).data,
};

export const maintenanceApi = {
  list: async () => (await api.get("/maintenance")).data,
  create: async (data: {
    component_id: number;
    maintenance_type: string;
    description: string;
    parts_replaced?: string;
    inspection_result: "PASSED" | "FAILED" | "WARNING";
  }) => (await api.post("/maintenance", data)).data,
};

export const verificationApi = {
  nfc: async (tag_identifier: string, payload?: string) =>
    (await api.post("/verification/nfc", { tag_identifier, payload })).data,
  logs: async () => (await api.get("/verification/logs")).data,
  componentLogs: async (id: number) => (await api.get(`/verification/components/${id}`)).data,
  blockchain: async (record_id: number) => (await api.post("/verification/blockchain", { record_id })).data,
};

export default api;

import axios from "axios";

const baseURL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const api = axios.create({ baseURL });

let isRefreshing = false;
let subscribers: Array<(token: string) => void> = [];

function onRefreshed(token: string) {
  subscribers.forEach((cb) => cb(token));
  subscribers = [];
}
function addSubscriber(cb: (t: string) => void) {
  subscribers.push(cb);
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers = config.headers || {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original: any = error.config;
    if (error?.response?.status === 401 && !original?._retry) {
      original._retry = true;
      const refresh = localStorage.getItem("refresh");
      if (!refresh) throw error;
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const { data } = await axios.post(`${baseURL}/api/auth/refresh/`, {
            refresh,
          });
          localStorage.setItem("access", data.access);
          isRefreshing = false;
          onRefreshed(data.access);
        } catch (e) {
          isRefreshing = false;
          localStorage.removeItem("access");
          localStorage.removeItem("refresh");
          localStorage.removeItem("user");
          window.location.href = "/login";
          throw error;
        }
      }
      return new Promise((resolve) => {
        addSubscriber((token) => {
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${token}`;
          resolve(api(original));
        });
      });
    }
    throw error;
  }
);

export type User = {
  id: number;
  username: string;
  role: "student" | "teacher" | "hod";
  email?: string;
};

export async function login(username: string, password: string) {
  const { data } = await api.post("/api/auth/token/", { username, password });
  // response contains: access, refresh, role, user_id, username (from your custom view)
  localStorage.setItem("access", data.access);
  localStorage.setItem("refresh", data.refresh);
  const user: User = {
    id: data.user_id,
    username: data.username,
    role: data.role,
  };
  localStorage.setItem("user", JSON.stringify(user));
  return user;
}

export function logout() {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

export function getUser(): User | null {
  const raw = localStorage.getItem("user");
  try {
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

import type { User } from "./types";
import api from "./api";

const USER_STORAGE_KEY = "meet5_logged_in_user";
const TOKEN_STORAGE_KEY = "token";

function normalizeUser(payload: any): User {
  const rawUser = payload?.user ?? payload;
  const email = typeof rawUser?.email === "string" ? rawUser.email : "";
  const name = rawUser?.name || rawUser?.display_name || rawUser?.username || email.split("@")[0] || "User";
  const username = rawUser?.username || email.split("@")[0] || name.toLowerCase().replace(/\s+/g, "-");

  return {
    user_id: rawUser?._id ?? rawUser?.user_id ?? 0,
    username,
    display_name: name,
    email,
    _id: rawUser?._id,
    name,
  } as User;
}

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? normalizeUser(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export async function authenticateUser(email: string, password: string): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();
  console.log(`[FRONTEND] Sending login request for email: "${normalizedEmail}"`);
  console.log(`[FRONTEND] API Target URL: ${api.defaults.baseURL}/auth/login`);

  try {
    const response = await api.post('/auth/login', {
      email: normalizedEmail,
      password,
    });

    console.log(`[FRONTEND] Received successful API response status ${response.status}:`, response.data);
    const { user, token } = response.data;
    if (token) {
      console.log(`[FRONTEND] Saving JWT token to localStorage (Token length: ${token.length})`);
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }

    const normalized = normalizeUser(user);
    console.log(`[FRONTEND] Normalized user object:`, normalized);
    setStoredUser(normalized);
    return normalized;
  } catch (error: any) {
    console.error(`[FRONTEND ERROR] Login request failed:`, error);
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || "Failed to authenticate. Please check your connection.");
  }
}

export async function registerUser(name: string, email: string, password: string): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();

  try {
    const response = await api.post('/auth/register', {
      name,
      email: normalizedEmail,
      password,
    });

    const { user, token } = response.data;
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }

    const normalized = normalizeUser(user);
    setStoredUser(normalized);
    return normalized;
  } catch (error: any) {
    if (error.response && error.response.data && error.response.data.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error(error.message || "Failed to register account.");
  }
}

export async function verifyCurrentSession(): Promise<User | null> {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) return null;

  try {
    const response = await api.get('/auth/me');
    if (response.data && response.data.user) {
      const user = normalizeUser(response.data.user);
      setStoredUser(user);
      return user;
    }
    return getStoredUser();
  } catch {
    return getStoredUser();
  }
}

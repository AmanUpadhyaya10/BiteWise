/**
 * api.ts  –  All calls to the BitWise FastAPI backend
 */

const BASE_URL = (import.meta.env.VITE_API_URL as string) ?? "http://localhost:8000";

// ─────────────────────────────────────────────
// Auth helpers
// ─────────────────────────────────────────────
export const auth = {
  save(userId: string, name: string, email: string) {
    localStorage.setItem("user_id", userId);
    localStorage.setItem("user_name", name);
    localStorage.setItem("user_email", email);
  },
  userId(): string | null { return localStorage.getItem("user_id"); },
  name(): string { return localStorage.getItem("user_name") ?? "You"; },
  email(): string { return localStorage.getItem("user_email") ?? ""; },
  isLoggedIn(): boolean { return !!localStorage.getItem("user_id"); },
  logout() {
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("user_email");
  },
};

// ─────────────────────────────────────────────
// Core fetch wrapper
// ─────────────────────────────────────────────
async function request<T>(
  path: string,
  options: RequestInit = {},
  withAuth = true
): Promise<T> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
    "ngrok-skip-browser-warning": "true",
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (withAuth) {
    const uid = auth.userId();
    if (uid) headers["x-user-id"] = uid;
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export interface Nutrition {
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export interface PredictResult {
  mode: "single" | "multi";
  scan_id: string;
  needs_user: boolean;
  top_k: Array<{ label: string; confidence: number }>;
  nutrition: Nutrition | null;
  image_url: string;
  items?: Array<{
    top_k: Array<{ label: string; confidence: number }>;
    nutrition: Nutrition | null;
  }>;
}

export interface MealEntry {
  id: string;
  food_name: string;
  meal_type: string;
  quantity_g: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  image_url: string | null;
  logged_at: string;
}

export interface TodayResponse {
  date: string;
  totals: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  goals: { calories: number; protein: number; carbs: number; fat: number; fiber: number };
  meals: MealEntry[];
}

export interface WeeklyDay {
  day: string;
  date: string;
  value: number;
}

export interface Goals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

// ─────────────────────────────────────────────
// API calls
// ─────────────────────────────────────────────
export const api = {
  // Nutrition search
  async nutritionSearch(q: string) {
    return request<{ results: Array<{ food: string; score: number; nutrition: Record<string, number> }> }>(
      `/nutrition/search?q=${encodeURIComponent(q)}`, {}, false
    );
  },

  // Auth
  async register(email: string, password: string, name: string) {
    return request<{ user_id: string; email: string; name: string }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify({ email, password, name }) },
      false
    );
  },
  async login(email: string, password: string) {
    return request<{ user_id: string; email: string; name: string }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify({ email, password }) },
      false
    );
  },

  // Profile
  async getProfile() {
    return request<{ id: string; name: string; email: string; goals: Goals }>("/users/me");
  },
  async updateProfile(name: string) {
    return request<{ ok: boolean; name: string }>("/users/me", {
      method: "PUT", body: JSON.stringify({ name }),
    });
  },

  // Goals
  async getGoals() {
    return request<Goals>("/users/me/goals");
  },
  async updateGoals(goals: Partial<Goals>) {
    return request<{ ok: boolean }>("/users/me/goals", {
      method: "PUT", body: JSON.stringify(goals),
    });
  },

  // Predict (food scan) — custom fetch to handle FormData + ngrok header
  async predict(imageFile: File, mode: "single" | "multi") {
    const fd = new FormData();
    fd.append("image", imageFile);
    fd.append("mode", mode);
    const uid = auth.userId();
    const headers: Record<string, string> = {
      "ngrok-skip-browser-warning": "true",
    };
    if (uid) headers["x-user-id"] = uid;
    const res = await fetch(`${BASE_URL}/predict`, {
      method: "POST", headers, body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail ?? "Request failed");
    }
    return res.json() as Promise<PredictResult>;
  },

  // Barcode
  async scanBarcodeImage(imageFile: File) {
    const fd = new FormData();
    fd.append("image", imageFile);
    const headers: Record<string, string> = { "ngrok-skip-browser-warning": "true" };
    const res = await fetch(`${BASE_URL}/scan-barcode`, {
      method: "POST", headers, body: fd,
    });
    return res.json() as Promise<{ barcode?: string; error?: string }>;
  },
  async lookupBarcode(code: string) {
    return request<{
      name: string; brand: string; calories: number;
      protein: number; carbs: number; fat: number;
      serving_grams: number | null; not_found?: boolean; error?: string;
    }>(`/barcode/${code}`, {}, false);
  },

  // Scan label (OCR)
  async scanLabel(imageFile: File) {
    const fd = new FormData();
    fd.append("image", imageFile);
    const uid = auth.userId();
    const headers: Record<string, string> = { "ngrok-skip-browser-warning": "true" };
    if (uid) headers["x-user-id"] = uid;
    const res = await fetch(`${BASE_URL}/scan-label`, {
      method: "POST", headers, body: fd,
    });
    return res.json() as Promise<{ raw_text: string; nutrition: Record<string, number> }>;
  },

  // Feedback
  async submitFeedback(scan_id: string, chosen_label: string, raw_text?: string) {
    return request<{ ok: boolean; label: string }>("/feedback/single", {
      method: "POST",
      body: JSON.stringify({ scan_id, chosen_label, raw_text: raw_text ?? null }),
    });
  },

  // Meals
  async logMeal(data: {
    food_name: string; meal_type: string; quantity_g: number;
    calories: number; protein: number; carbs: number; fat: number;
    fiber?: number; scan_id?: string; image_url?: string;
  }) {
    return request<{ ok: boolean; meal_id: string }>("/meals/log", {
      method: "POST", body: JSON.stringify(data),
    });
  },
  async deleteMeal(meal_id: string) {
    return request<{ ok: boolean }>(`/meals/${meal_id}`, { method: "DELETE" });
  },
  async getToday() {
    return request<TodayResponse>("/meals/today");
  },
  async getHistory(days = 7) {
    return request<MealEntry[]>(`/meals/history?days=${days}`);
  },
  async getWeekly() {
    return request<WeeklyDay[]>("/meals/weekly");
  },
  async getStreak() {
    return request<{ streak: number }>("/meals/streak");
  },
};
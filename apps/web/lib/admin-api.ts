/**
 * Client-side admin API client — used in "use client" components.
 * Sends the JWT cookie automatically via credentials: 'include'.
 */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function req<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401) {
    window.location.href = "/admin/login";
    throw new Error("Unauthorized");
  }

  if (res.status === 204) return null as T;

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
  }

  return json as T;
}

function qs(params?: Record<string, string | undefined>) {
  if (!params) return "";
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") p.set(k, v);
  }
  const s = p.toString();
  return s ? `?${s}` : "";
}

export const adminClient = {
  // ── Auth ──────────────────────────────────────────────────────────────────
  login: (email: string, password: string) =>
    req("/api/admin/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  logout: () =>
    req("/api/admin/auth/logout", { method: "POST" }),

  me: () => req("/api/admin/auth/me"),

  // ── Blogs ─────────────────────────────────────────────────────────────────
  getBlogs: (params?: Record<string, string | undefined>) =>
    req(`/api/admin/blogs${qs(params)}`),

  getBlog: (id: string) => req(`/api/admin/blogs/${id}`),

  createBlog: (data: Record<string, unknown>) =>
    req("/api/admin/blogs", { method: "POST", body: JSON.stringify(data) }),

  updateBlog: (id: string, data: Record<string, unknown>) =>
    req(`/api/admin/blogs/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteBlog: (id: string) =>
    req(`/api/admin/blogs/${id}`, { method: "DELETE" }),

  // ── Projects ──────────────────────────────────────────────────────────────
  getProjects: (params?: Record<string, string | undefined>) =>
    req(`/api/admin/projects${qs(params)}`),

  getProject: (id: string) => req(`/api/admin/projects/${id}`),

  createProject: (data: Record<string, unknown>) =>
    req<{ data: { id: string; slug: string } }>("/api/admin/projects", { method: "POST", body: JSON.stringify(data) }),

  updateProject: (id: string, data: Record<string, unknown>) =>
    req<{ data: { id: string; slug: string } }>(`/api/admin/projects/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  uploadProjectCover: async (file: File, projectSlug: string) => {
    const formData = new FormData();
    formData.append("projectSlug", projectSlug);
    formData.append("file", file);

    const res = await fetch(`${BASE}/api/admin/uploads/project-cover`, {
      method: "POST",
      credentials: "include",
      body: formData,
    });

    if (res.status === 401) {
      window.location.href = "/admin/login";
      throw new Error("Unauthorized");
    }

    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
    return json as { data: { url: string; path: string; filename: string; mimeType: string; sizeBytes: number } };
  },

  deleteProject: (id: string) =>
    req(`/api/admin/projects/${id}`, { method: "DELETE" }),

  // ── Experiences ───────────────────────────────────────────────────────────
  getExperiences: () => req("/api/admin/experiences"),

  createExperience: (data: Record<string, unknown>) =>
    req("/api/admin/experiences", { method: "POST", body: JSON.stringify(data) }),

  updateExperience: (id: string, data: Record<string, unknown>) =>
    req(`/api/admin/experiences/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  deleteExperience: (id: string) =>
    req(`/api/admin/experiences/${id}`, { method: "DELETE" }),

  reorderExperiences: (items: { id: string; sortOrder: number }[]) =>
    req("/api/admin/experiences/reorder", {
      method: "PATCH",
      body: JSON.stringify(items),
    }),

  // ── Comments ──────────────────────────────────────────────────────────────
  getComments: (params?: Record<string, string | undefined>) =>
    req(`/api/admin/comments${qs(params)}`),

  updateCommentStatus: (id: string, status: string) =>
    req(`/api/admin/comments/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  deleteComment: (id: string) =>
    req(`/api/admin/comments/${id}`, { method: "DELETE" }),

  // ── Contact Submissions ───────────────────────────────────────────────────
  getContactSubmissions: (params?: Record<string, string | undefined>) =>
    req(`/api/admin/contact-submissions${qs(params)}`),

  updateContactStatus: (id: string, status: string) =>
    req(`/api/admin/contact-submissions/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),

  // ── Assets ────────────────────────────────────────────────────────────────
  getAssets: () => req("/api/admin/assets"),

  updateAsset: (key: string, data: Record<string, unknown>) =>
    req(`/api/admin/assets/${key}`, { method: "PATCH", body: JSON.stringify(data) }),

  // ── Auth / Profile ────────────────────────────────────────────────────────
  getMe: () =>
    req<{ data: { id: string; email: string; name: string; role: string; lastLoginAt: string | null } }>(
      "/api/admin/auth/me"
    ).then((res) => res.data),

  updateProfile: (data: { name?: string; email?: string }) =>
    req("/api/admin/auth/me", { method: "PATCH", body: JSON.stringify(data) }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    req("/api/admin/auth/password", { method: "PATCH", body: JSON.stringify(data) }),
};

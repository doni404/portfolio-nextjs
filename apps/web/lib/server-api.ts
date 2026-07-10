/**
 * Server-side API client — used only in Next.js Server Components.
 * Calls the Express backend with optional ISR revalidation.
 */
import { cookies } from "next/headers";

const API_URL = process.env.API_URL ?? "http://localhost:4000";

// ─── Generic fetcher ─────────────────────────────────────────────────────────

async function get<T>(
  path: string,
  opts: { revalidate?: number } = {}
): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      // Use no-store so mutations in the admin always show up immediately.
      // Revalidate only when an explicit positive value is requested.
      ...(opts.revalidate && opts.revalidate > 0
        ? { next: { revalidate: opts.revalidate } }
        : { cache: "no-store" }),
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

async function adminGet<T>(path: string): Promise<T | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const res = await fetch(`${API_URL}${path}`, {
      cache: "no-store",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return res.json() as Promise<T>;
  } catch {
    return null;
  }
}

// ─── Response shape helpers ───────────────────────────────────────────────────

export type Paginated<T> = {
  data: T[];
  pagination: { page: number; pageSize: number; total: number; totalPages: number };
};

export type Single<T> = { data: T };

// ─── Public API ───────────────────────────────────────────────────────────────

export const publicApi = {
  /** GET /api/blogs — paginated, filterable */
  getBlogs: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return get<Paginated<BlogPost>>(`/api/blogs${qs}`);
  },

  /** GET /api/blogs/:slug */
  getBlog: (slug: string) =>
    get<Single<BlogPost>>(`/api/blogs/${slug}`),

  /** GET /api/blogs/:slug/comments */
  getComments: (slug: string) =>
    get<Single<Comment[]>>(`/api/blogs/${slug}/comments`),

  /** GET /api/projects — paginated, filterable */
  getProjects: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return get<Paginated<Project>>(`/api/projects${qs}`);
  },

  /** GET /api/experiences */
  getExperiences: () =>
    get<Single<Experience[]>>("/api/experiences"),

  /** GET /api/profile */
  getProfile: () =>
    get<Single<Profile>>("/api/profile"),
};

// ─── Admin API (server-side, requires JWT cookie) ────────────────────────────

export const adminApi = {
  getDashboard: () =>
    adminGet<Single<Dashboard>>("/api/admin/dashboard"),

  getBlogs: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return adminGet<Paginated<BlogPost>>(`/api/admin/blogs${qs}`);
  },

  getBlog: (id: string) =>
    adminGet<Single<BlogPost>>(`/api/admin/blogs/${id}`),

  getProjects: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return adminGet<Paginated<Project>>(`/api/admin/projects${qs}`);
  },

  getProject: (id: string) =>
    adminGet<Single<Project>>(`/api/admin/projects/${id}`),

  getExperiences: () =>
    adminGet<Single<Experience[]>>("/api/admin/experiences"),

  getComments: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return adminGet<Paginated<AdminComment>>(`/api/admin/comments${qs}`);
  },

  getContactSubmissions: (params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return adminGet<Paginated<ContactSubmission>>(`/api/admin/contact-submissions${qs}`);
  },

  getAssets: () =>
    adminGet<Single<SiteAsset[]>>("/api/admin/assets"),
};

// ─── Shared types matching API response shape ─────────────────────────────────

export type Tag = { id: string; name: string; slug: string };
export type Category = { id: string; name: string; slug: string };
export type Author = { id: string; name: string; slug: string; avatarUrl?: string; title?: string; bio?: string };

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImageUrl?: string;
  publishedAt?: string;
  updatedAt: string;
  createdAt: string;
  status: "draft" | "published" | "archived";
  featured: boolean;
  readingTimeMinutes: number;
  seoTitle?: string;
  seoDescription?: string;
  category?: Category;
  tags: Tag[];
  author?: Author;
};

export type Project = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  problem?: string;
  solution?: string;
  role?: string;
  outcome?: string;
  stack: string[];
  year?: number;
  featured: boolean;
  sortOrder: number;
  status: string;
  links: { label: string; url: string }[];
  category?: Category;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
};

export type Experience = {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  summary?: string;
  highlights: string[];
  technologies: string[];
  sortOrder: number;
};

export type Comment = {
  id: string;
  authorName: string;
  authorWebsite?: string;
  content: string;
  approvedAt?: string;
  createdAt: string;
  replies?: Comment[];
};

export type AdminComment = {
  id: string;
  authorName: string;
  authorEmail: string;
  authorWebsite?: string;
  content: string;
  status: "pending" | "approved" | "rejected" | "spam";
  createdAt: string;
  approvedAt?: string;
  blogPost: { id: string; title: string; slug: string };
};

export type ContactSubmission = {
  id: string;
  name: string;
  email: string;
  company?: string;
  subject?: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  createdAt: string;
  updatedAt: string;
};

export type Certification = {
  id: string;
  name: string;
  issuer?: string;
  score?: string;
  issuedAt?: string;
  sortOrder: number;
};

export type Education = {
  id: string;
  institution: string;
  degree: string;
  location?: string;
  startYear?: number;
  endYear?: number;
  gpa?: string;
  highlights: string[];
  sortOrder: number;
};

export type Profile = {
  author: Author & { email?: string; linkedinUrl?: string };
  skillGroups: Record<string, string[]>;
  certifications: Certification[];
  education: Education[];
};

export type SiteAsset = {
  id: string;
  key: string;
  label: string;
  fileUrl: string;
  mimeType?: string;
  sizeBytes?: number;
  updatedAt: string;
};

export type Dashboard = {
  stats: {
    publishedPosts: number;
    draftPosts: number;
    pendingComments: number;
    newContactSubmissions: number;
    featuredProjects: number;
  };
  recentComments: AdminComment[];
  recentSubmissions: Pick<ContactSubmission, "id" | "name" | "email" | "subject" | "createdAt" | "status">[];
};

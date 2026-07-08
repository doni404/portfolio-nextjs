"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, Lock } from "lucide-react";

interface LoginFormData {
  email: string;
  password: string;
}

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    setError("");
    // Simulate API call to POST /api/admin/auth/login
    await new Promise((r) => setTimeout(r, 800));

    // Mock auth — in production this calls the Express API
    if (data.email === "doniputrapurbawa@gmail.com" && data.password === "admin") {
      router.push("/admin");
    } else {
      setError("Invalid email or password.");
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
        <input
          {...register("email", {
            required: "Email is required",
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" },
          })}
          type="email"
          autoComplete="email"
          placeholder="doniputrapurbawa@gmail.com"
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
        />
        {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
        <div className="relative">
          <input
            {...register("password", { required: "Password is required" })}
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-10 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          <Lock className="h-4 w-4" />
        )}
        {loading ? "Signing in…" : "Sign In"}
      </button>

      <p className="mt-2 text-center text-xs text-slate-400">
        Demo: use any email + &quot;admin&quot; as password
      </p>
    </form>
  );
}

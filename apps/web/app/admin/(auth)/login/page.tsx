import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/admin/LoginForm";
import { BrandMark } from "@/components/brand/BrandMark";
export const metadata: Metadata = {
  title: "Studio Login",
  robots: { index: false, follow: false },
};
export default function AdminLogin() {
  return (
    <div className="admin-login">
      <div className="admin-login-form">
        <div>
          <Link href="/" className="admin-login-brand"><BrandMark /> Doni Putra.</Link>
          <h1>Admin sign in</h1>
          <LoginForm />
          <small>
            Private workspace
          </small>
        </div>
      </div>
    </div>
  );
}

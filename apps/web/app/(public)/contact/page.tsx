import type { Metadata } from "next";
import { Mail, MapPin, Send } from "lucide-react";
import { buildMetadata } from "@/lib/metadata";
import { ContactForm } from "@/components/ContactForm";

export const metadata: Metadata = buildMetadata({
  title: "Contact",
  description:
    "Get in touch with Doni Putra Purbawa — open to backend engineering roles, consulting, and technical discussions.",
  path: "/contact",
  imageTitle: "Contact Doni Putra",
  imageDescription: "Open to senior backend engineering roles, consulting, and technical discussions.",
});

export default function Contact() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
          <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">Get In Touch</h1>
          <p className="mt-2 max-w-xl text-slate-500">
            Open to senior backend engineering roles, consulting engagements, and technical
            discussions. Based in Indonesia — available remotely or willing to relocate to Japan.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-5">
          {/* Contact info */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="mb-4 font-semibold text-slate-900">Contact Details</h2>
              <div className="space-y-4">
                <a
                  href="mailto:doniputrapurbawa@gmail.com"
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-blue-200 hover:bg-blue-50 group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Email</p>
                    <p className="text-sm font-medium text-slate-900 group-hover:text-blue-700">
                      doniputrapurbawa@gmail.com
                    </p>
                  </div>
                </a>
                <a
                  href="https://linkedin.com/in/doniputrapurbawa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-blue-200 hover:bg-blue-50 group"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">LinkedIn</p>
                    <p className="text-sm font-medium text-slate-900 group-hover:text-blue-700">
                      doniputrapurbawa
                    </p>
                  </div>
                </a>
                <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Location</p>
                    <p className="text-sm font-medium text-slate-900">Indonesia</p>
                    <p className="text-xs text-slate-400">Open to Japan relocation · JLPT N4</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
              <h3 className="font-semibold text-slate-900">What I&apos;m open to</h3>
              <ul className="mt-3 space-y-2">
                {[
                  "Senior Backend Engineering roles",
                  "Cloud & DevOps consulting",
                  "Fintech and payment system projects",
                  "AI/LLM backend integration work",
                  "Japan-facing remote or relocation roles",
                  "Technical discussions and collaborations",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6 sm:p-8">
              <h2 className="mb-6 flex items-center gap-2 font-semibold text-slate-900">
                <Send className="h-4 w-4 text-blue-600" /> Send a Message
              </h2>
              <ContactForm />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

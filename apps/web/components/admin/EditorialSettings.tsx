"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Save, RefreshCw, Mail, ArrowUpRight, Square } from "lucide-react";
import { adminClient } from "@/lib/admin-api";
import type { EditorialOverview } from "@/lib/editorial-types";
import { AdminPageHeader } from "./AdminPageHeader";

export function EditorialSettings() {
  const [data, setData] = useState<EditorialOverview | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { try { setData((await adminClient.getEditorial()).data); setError(""); } catch (e) { setError((e as Error).message); } }, []);
  useEffect(() => {
    let active = true;
    adminClient.getEditorial().then((res) => { if (active) setData(res.data); }).catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, []);
  async function save(event: React.FormEvent) {
    event.preventDefault(); if (!data) return;
    setBusy(true); setError(""); setMessage("");
    try { await adminClient.saveEditorial({ ...data.config, monthlyBudgetUsd: Number(data.config.monthlyBudgetUsd), recipientEmail: data.config.recipientEmail ?? "" }); setMessage("Settings saved."); await load(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  async function jobAction(id: string, action: "stop" | "email") {
    setBusy(true); setError("");
    try { if (action === "stop") await adminClient.stopExpiredJob(id); else await adminClient.resendReviewEmail(id); await load(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  function config(patch: Partial<EditorialOverview["config"]>) { setData((current) => current ? { ...current, config: { ...current.config, ...patch } } : current); }
  return <div className="admin-page">
    <AdminPageHeader title="Journal Automation" description="Drafts only. You review and publish." actions={<button className="admin-icon-button" title="Refresh" onClick={() => void load()}><RefreshCw size={17} /></button>} />
    {error && <p className="admin-alert" role="alert">{error}</p>}{message && <p className="admin-notice" role="status">{message}</p>}
    {!data ? <p className="admin-empty">{error ? "Unable to load settings." : "Loading settings..."}</p> : <>
      {data.state && <p className="admin-notice" role="status">{data.state.message}{data.today && ` ${data.today.attempts} of ${data.today.limit} attempts used today (WIB).`}</p>}
      <form onSubmit={save} className="admin-settings">
        <section className="admin-settings-section"><div><h2>Publishing cadence</h2><p className="admin-help">Daily quota resets at midnight, Jakarta time.</p></div><div className="admin-control-stack">
          <label className="admin-switch-label"><input type="checkbox" checked={data.config.enabled} onChange={(e) => config({ enabled: e.target.checked })} />Automation {data.config.enabled ? "ON" : "OFF"}</label>
          <div className="admin-control-pair"><label>Drafts per day<input type="number" min={1} max={5} required value={data.config.dailyLimit} onChange={(e) => config({ dailyLimit: Number(e.target.value) })} /></label><label>Monthly AI limit (USD)<input type="number" min={0} max={100} step={0.5} required value={data.config.monthlyBudgetUsd} onChange={(e) => config({ monthlyBudgetUsd: e.target.value })} /></label></div>
          <div className="admin-control-pair"><label>Routine<select value={data.config.runAt === "09:00" ? "morning" : data.config.runAt === "19:00" ? "evening" : "custom"} onChange={(e) => config({ runAt: e.target.value === "morning" ? "09:00" : e.target.value === "evening" ? "19:00" : "12:00" })}><option value="morning">Morning</option><option value="evening">Evening</option><option value="custom">Custom</option></select></label><label>Draft preparation time (WIB)<input type="time" required value={data.config.runAt} onChange={(e) => config({ runAt: e.target.value })} /></label></div>
          <p className="admin-help">Asia/Jakarta. Preparation starts on the next worker check after this time. Publishing remains manual.</p>
          <label className="admin-switch-label"><input type="checkbox" checked={data.config.generateImages} onChange={(e) => config({ generateImages: e.target.checked })} />Generate editorial covers</label>
          <p className="admin-help">Generation pauses at the limit. An already-started request may finish. Uncertain charges stay reserved.</p>
        </div></section>
        <section className="admin-settings-section"><div><h2>Topics & review</h2><p className="admin-help">Original, source-linked English explainers.</p></div><div className="admin-control-stack"><label>Topics, one per line<textarea rows={4} value={data.config.topics.join("\n")} onChange={(e) => config({ topics: e.target.value.split("\n") })} /></label><label>Review email (optional)<input type="email" value={data.config.recipientEmail ?? ""} onChange={(e) => config({ recipientEmail: e.target.value })} placeholder="Your email address" /></label><div className="admin-connection-list"><span data-ready={data.readiness.worker}>Worker: {data.readiness.worker ? "connected" : data.workerConfigured ? "waiting for heartbeat" : "token not configured"}</span><span data-ready={data.readiness.email}>Email: {data.readiness.email ? "configured" : "not configured (optional)"}</span><span data-ready={data.readiness.analytics}>Analytics: {data.readiness.analytics ? "configured" : "not connected"}</span></div>{data.config.workerLastSeenAt && <p className="admin-help">Worker last seen: {new Date(data.config.workerLastSeenAt).toLocaleString("en-GB", { timeZone: "Asia/Jakarta" })} WIB</p>}<button type="submit" disabled={busy} className="admin-primary-button"><Save size={15} />{busy ? "Saving..." : "Save settings"}</button></div></section>
      </form>
      <section className="admin-report-section"><h2 className="admin-section-title">Generation history <Link href="/admin/ai-usage" className="text-xs font-normal">AI usage <ArrowUpRight size={13} className="inline" /></Link></h2>
        {data.jobs.length === 0 ? <p className="admin-empty">No generation jobs yet.</p> : <div className="admin-report-table"><table><thead><tr><th>Story / slot</th><th>Status</th><th>Email</th><th>Date</th><th /></tr></thead><tbody>{data.jobs.map((job) => <tr key={job.id}><td>{job.blogPostId ? <Link href={`/admin/blogs/${job.blogPostId}`}>{job.title ?? "Review draft"}</Link> : job.title ?? `Draft ${job.slot}`}<small title={job.errorCode ?? undefined}>{job.errorDescription ?? job.errorCode}</small></td><td>{job.status}</td><td>{job.emailStatus}</td><td>{job.day}</td><td><div className="admin-row-actions">{job.blogPostId && <button title="Send review email again" disabled={busy || !data.readiness.email} onClick={() => void jobAction(job.id, "email")}><Mail size={16} /></button>}{job.status === "running" && new Date(job.leaseUntil) < new Date() && <button title="Stop expired job; keep uncertain costs reserved" disabled={busy} onClick={() => void jobAction(job.id, "stop")}><Square size={16} /></button>}</div></td></tr>)}</tbody></table></div>}
      </section>
    </>}
  </div>;
}

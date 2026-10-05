"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { adminClient } from "@/lib/admin-api";
import type { AnalyticsReport, ReportRow } from "@/lib/editorial-types";
import { AdminPageHeader } from "./AdminPageHeader";
function ReportTable({ rows, label, metrics }: { rows: ReportRow[]; label: string; metrics: string[] }) {
  return rows.length ? <div className="admin-report-table"><table><thead><tr><th>{label}</th>{metrics.map((metric) => <th key={metric}>{metric}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={`${row.dimensions.join("-")}-${index}`}><td>{row.dimensions[1] ?? row.dimensions[0]}{row.dimensions[1] && <small>{row.dimensions[0]}</small>}</td>{row.metrics.map((value, i) => <td key={i}>{Math.round(value).toLocaleString()}</td>)}</tr>)}</tbody></table></div> : <p className="admin-empty">No data for this period.</p>;
}
export function TrafficAnalytics({ compact = false }: { compact?: boolean }) {
  const [days, setDays] = useState(30);
  const [refresh, setRefresh] = useState(0);
  const [result, setData] = useState<AnalyticsReport | null>(null);
  const [loadedFor, setLoadedFor] = useState("");
  const data = loadedFor === `${days}:${refresh}` ? result : null;
  const [error, setError] = useState("");
  useEffect(() => { let active = true; adminClient.getAnalytics(days).then((res) => { if (active) { setData(res.data); setLoadedFor(`${days}:${refresh}`); setError(""); } }).catch((e) => { if (active) setError(e.message); }); return () => { active = false; }; }, [days, refresh]);
  const traffic = data?.traffic;
  const values = traffic?.summary ?? [];
  return <section className={compact ? "admin-report-section" : "admin-page"}>
    {compact ? <h2 className="admin-section-title">Audience <Link href="/admin/analytics" className="text-xs font-normal">Full report <ArrowUpRight size={13} className="inline" /></Link></h2> : <AdminPageHeader title="Audience Analytics" description="GA4 reporting through yesterday; cached for five minutes." actions={<><select aria-label="Report period" value={days} onChange={(e) => setDays(Number(e.target.value))}><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option></select><button className="admin-icon-button" title="Refresh report" onClick={() => setRefresh((n) => n + 1)}><RefreshCw size={17} /></button></>} />}
    {error && <p role="alert" className="admin-alert">{error}</p>}
    {!data && !error && <p className="admin-help">Loading analytics...</p>}
    {traffic && !traffic.connected && <p className="admin-notice">{traffic.message}</p>}
    {traffic?.connected && <><div className="admin-metric-strip">{["Active users", "Sessions", "Page views", "Engagement", "Avg. session"].map((label, i) => <div key={label}><span>{label}</span><strong>{i === 3 ? `${Math.round((values[i] ?? 0) * 100)}%` : i === 4 ? `${Math.round(values[i] ?? 0)}s` : (values[i] ?? 0).toLocaleString()}</strong></div>)}</div>{traffic.thresholded && <p className="admin-help">Google applied privacy thresholds; some results may be withheld.</p>}<section className="admin-report-section"><h2 className="admin-section-title">Most-read journal articles</h2><ReportTable rows={traffic.pages ?? []} label="Article" metrics={["Views", "Users", "Engaged seconds"]} /></section>{!compact && <><section className="admin-report-section"><h2 className="admin-section-title">Pages that bring visits</h2><ReportTable rows={traffic.entries ?? []} label="Landing page" metrics={["Sessions", "Users"]} /></section><section className="admin-report-section"><h2 className="admin-section-title">Traffic sources</h2><ReportTable rows={traffic.sources ?? []} label="Source / medium" metrics={["Sessions"]} /></section><section className="admin-report-section"><h2 className="admin-section-title">Reader actions</h2><ReportTable rows={traffic.events ?? []} label="Action" metrics={["Events"]} /></section></>}</>}
    {!compact && data && <section className="admin-report-section"><h2 className="admin-section-title">Article likes <span className="text-xs font-normal text-slate-500">All-time, anonymous reader actions</span></h2><div className="admin-report-table"><table><thead><tr><th>Article</th><th>Likes</th></tr></thead><tbody>{data.liked.map((post) => <tr key={post.slug}><td><Link href={`/blogs/${post.slug}`}>{post.title}</Link></td><td>{post._count.likes}</td></tr>)}</tbody></table></div><p className="admin-help">Likes are not verified unique people. Clearing browser storage can create a new anonymous reader ID.</p></section>}
  </section>;
}

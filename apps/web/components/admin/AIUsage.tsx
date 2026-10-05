"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { adminClient } from "@/lib/admin-api";
import type { UsageReport } from "@/lib/editorial-types";
import { AdminPageHeader } from "./AdminPageHeader";
const money = (value: number | string) => `$${Number(value).toFixed(4)}`;
export function AIUsage() {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [report, setData] = useState<UsageReport | null>(null);
  const data = report?.month === month ? report : null;
  const [error, setError] = useState("");
  useEffect(() => { let active = true; adminClient.getAIUsage(month).then((res) => { if (active) { setData(res.data); setError(""); } }).catch((e) => { if (active) setError(e.message); }); return () => { active = false; }; }, [month]);
  return <div className="admin-page"><AdminPageHeader title="AI Usage" description="Estimated API costs in USD. Billing months use UTC." actions={<input type="month" aria-label="Billing month" value={month} onChange={(e) => { if (e.target.value) setMonth(e.target.value); }} />} />
    {error && <p role="alert" className="admin-alert">{error}</p>}{data ? <>
      <div className="admin-metric-strip">{[["Estimated spend", money(data.totals.cost)], ["Reserved / uncertain", money(data.totals.held)], ["Monthly limit", money(data.budget)], ["Requests", data.totals.calls.toLocaleString()], ["Tokens", data.totals.tokens.toLocaleString()]].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
      <p className="admin-help">Covers, research, writing, and review are logged separately. No charge is recorded as zero when usage is unknown. Compare estimates with your OpenAI billing dashboard.</p>
      <section className="admin-report-section"><h2 className="admin-section-title">Requests</h2><div className="admin-report-table"><table><thead><tr><th>Story</th><th>Stage / model</th><th>Tokens in / out</th><th>Status</th><th>USD</th><th>UTC date</th></tr></thead><tbody>{data.logs.map((log) => <tr key={log.id}><td>{log.job.blogPostId ? <Link href={`/admin/blogs/${log.job.blogPostId}`}>{log.job.title ?? "Draft"}</Link> : log.job.title ?? "Topic research"}<small title={log.requestId ?? undefined}>{log.requestId}</small></td><td>{log.stage}<small>{log.model}</small></td><td>{log.inputTokens.toLocaleString()} / {log.outputTokens.toLocaleString()}<small>{log.searchCalls} searches</small></td><td>{log.status}</td><td>{log.estimatedUsd == null ? `${money(log.reservedUsd)} held` : money(log.estimatedUsd)}</td><td>{log.createdAt.slice(0, 16).replace("T", " ")}</td></tr>)}</tbody></table></div>{!data.logs.length && <p className="admin-empty">No AI requests in this month.</p>}</section>
      <section className="admin-report-section"><h2 className="admin-section-title">Monthly history</h2>{data.months.length ? <div className="admin-report-table"><table><thead><tr><th>Month</th><th>Requests</th><th>Estimated USD</th><th>Reserved USD</th></tr></thead><tbody>{data.months.map((item) => <tr key={item.month}><td><button onClick={() => setMonth(item.month)}>{item.month}</button></td><td>{item.calls}</td><td>{money(item.estimated)}</td><td>{money(item.held)}</td></tr>)}</tbody></table></div> : <p className="admin-help">History appears after the first API request.</p>}</section>
    </> : !error && <p className="admin-empty">Loading usage...</p>}</div>;
}

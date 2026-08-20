"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell, PageHeading, StatusPill, EmptyState } from "../components/AppShell";
import { apiGet } from "../components/api";

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { apiGet("/api/workflows").then((data) => setWorkflows(data.workflows || [])).catch((err) => setError(err.message)); }, []);
  return <AppShell eyebrow="WORKFLOW HISTORY"><PageHeading eyebrow="Persistent activity" title="Workflow history" description="Every document run, its selected agents, status, and x402 cost in one place." action={<Link href="/workflow" className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-[#07111f]">New workflow</Link>} />{error && <div className="mb-6 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</div>}{workflows.length === 0 ? <EmptyState title="Your history is empty" description="Completed and failed workflow runs will appear here." /> : <div className="overflow-hidden rounded-2xl border border-white/10"><div className="hidden grid-cols-[1fr_1.3fr_auto_auto_auto] gap-4 bg-white/[0.03] px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500 md:grid"><span>Document</span><span>Agents</span><span>Status</span><span>Date</span><span>Cost</span></div>{workflows.map((workflow) => <Link href={`/workflows/${workflow.workflowId}`} key={workflow.workflowId} className="grid gap-2 border-t border-white/10 px-5 py-4 hover:bg-white/[0.03] md:grid-cols-[1fr_1.3fr_auto_auto_auto] md:items-center md:gap-4"><span className="truncate text-sm text-white">{workflow.file}</span><span className="text-xs text-slate-500">{workflow.agentsUsed?.join(" + ") || workflow.task}</span><StatusPill status={workflow.status} /><span className="text-xs text-slate-500">{new Date(workflow.createdAt).toLocaleDateString()}</span><span className="text-sm text-slate-300">${Number(workflow.totalCost || 0).toFixed(2)}</span></Link>)}</div>}</AppShell>;
}

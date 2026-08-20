"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell, PageHeading, StatusPill, EmptyState } from "../../components/AppShell";
import { apiGet } from "../../components/api";

export default function WorkflowDetailsPage() {
  const { id } = useParams();
  const [workflow, setWorkflow] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { if (id) apiGet(`/api/workflows/${id}`).then((data) => setWorkflow(data.workflow)).catch((err) => setError(err.message)); }, [id]);
  if (error) return <AppShell eyebrow="WORKFLOW DETAIL"><EmptyState title="Workflow unavailable" description={error} action={<Link href="/workflows" className="mt-5 inline-flex rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-[#07111f]">Back to history</Link>} /></AppShell>;
  if (!workflow) return <AppShell eyebrow="WORKFLOW DETAIL"><p className="text-sm text-slate-500">Loading workflow...</p></AppShell>;
  return <AppShell eyebrow="WORKFLOW DETAIL"><PageHeading eyebrow="Persistent result" title={workflow.file} description={`Workflow ${workflow.workflowId}`} action={<StatusPill status={workflow.status} />} /><div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]"><div className="rounded-2xl border border-white/10 bg-[#0b1b2d] p-6"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Execution</p><dl className="mt-6 space-y-5">{[["Agents", workflow.agentsUsed?.join(" + ") || workflow.task], ["Cost", `$${Number(workflow.totalCost || 0).toFixed(2)} USDC`], ["Created", new Date(workflow.createdAt).toLocaleString()], ["Workflow ID", workflow.workflowId]].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm text-white">{value}</dd></div>)}</dl></div><div className="rounded-2xl border border-white/10 bg-[#0b1b2d] p-6"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Results</p><pre className="mt-5 max-h-[600px] overflow-auto whitespace-pre-wrap text-sm leading-6 text-slate-300">{JSON.stringify(workflow.result, null, 2)}</pre></div></div></AppShell>;
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell, PageHeading, StatusPill, EmptyState } from "./components/AppShell";
import { apiGet } from "./components/api";

const DEFAULT_AGENT_PRICE = 0.01;

const fallbackAgents = [
  { name: "OCR Agent", description: "Extract text from images and documents.", category: "documents", pricePerRequest: DEFAULT_AGENT_PRICE },
  { name: "Summary Agent", description: "Turn extracted document text into a clear brief.", category: "language", pricePerRequest: DEFAULT_AGENT_PRICE },
  { name: "Fraud Agent", description: "Detect suspicious invoice patterns and payment risk.", category: "security", pricePerRequest: DEFAULT_AGENT_PRICE },
  { name: "PII Detection Agent", description: "Detect sensitive information in text and documents.", category: "security", pricePerRequest: DEFAULT_AGENT_PRICE },
];

export default function Dashboard() {
  const [agents, setAgents] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.allSettled([apiGet("/api/agents"), apiGet("/api/workflows")]).then(([agentResult, workflowResult]) => {
      if (agentResult.status === "fulfilled") setAgents(agentResult.value.agents || []);
      if (workflowResult.status === "fulfilled") setWorkflows(workflowResult.value.workflows || []);
      if (agentResult.status === "rejected" && workflowResult.status === "rejected") {
        console.warn("Live dashboard data is unavailable; showing the local fallback view.");
      }
    });
  }, []);

  const visibleAgents = agents.length ? agents : fallbackAgents;
  const completed = workflows.filter((workflow) => workflow.status === "completed").length;
  const totalSpend = workflows.reduce((total, workflow) => total + Number(workflow.totalCost || 0), 0);

  return (
    <AppShell eyebrow="DASHBOARD">
      <PageHeading eyebrow="Workspace overview" title="Welcome to AgentHub" description="AI agents for intelligent document processing, from the first upload to a verified workflow result." action={<Link href="/workflow" className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#07111f] hover:bg-cyan-100">Create workflow</Link>} />
      {error && <div className="mb-6 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">Unable to load live data: {error}</div>}

      <div className="grid gap-4 sm:grid-cols-3">
        {[["Available agents", visibleAgents.length, "Online now"], ["Completed workflows", completed, "Across your workspace"], ["Workflow spend", `$${totalSpend.toFixed(2)}`, "x402 usage" ]].map(([label, value, detail]) => <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"><p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p><p className="mt-4 text-3xl font-semibold text-white">{value}</p><p className="mt-2 text-xs text-emerald-300">{detail}</p></div>)}
      </div>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Agent catalog</p><h2 className="mt-2 text-xl font-semibold text-white">Your processing team</h2></div><Link href="/agents" className="text-sm text-slate-400 hover:text-white">View all agents →</Link></div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {visibleAgents.slice(0, 4).map((agent) => { const price = Number(agent.pricePerRequest); const displayPrice = Number.isFinite(price) && price > 0 ? price : DEFAULT_AGENT_PRICE; return <Link href="/workflow" key={agent._id || agent.name} className="group rounded-2xl border border-white/10 bg-[#0b1b2d] p-5 transition hover:-translate-y-1 hover:border-cyan-300/40"><div className="flex items-start justify-between"><span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-[11px] uppercase tracking-wider text-cyan-200">{agent.category}</span><StatusPill status="Online" /></div><h3 className="mt-8 text-lg font-semibold text-white">{agent.name}</h3><p className="mt-2 min-h-12 text-sm leading-5 text-slate-400">{agent.description}</p><p className="mt-6 text-sm text-slate-300">${displayPrice.toFixed(2)} <span className="text-slate-500">per request</span></p></Link>; })}
        </div>
      </section>

      <section className="mt-10"><div className="mb-4 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Activity</p><h2 className="mt-2 text-xl font-semibold text-white">Recent workflows</h2></div><Link href="/workflows" className="text-sm text-slate-400 hover:text-white">Open history →</Link></div>
        {workflows.length === 0 ? <EmptyState title="No workflows yet" description="Upload an invoice or document to start your first intelligent workflow." action={<Link href="/workflow" className="mt-5 inline-flex rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-[#07111f]">Start processing</Link>} /> : <div className="overflow-hidden rounded-2xl border border-white/10"><div className="grid grid-cols-[1fr_auto_auto] gap-4 bg-white/[0.03] px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500"><span>Document</span><span>Status</span><span>Cost</span></div>{workflows.slice(0, 5).map((workflow) => <Link href={`/workflows/${workflow.workflowId}`} key={workflow.workflowId} className="grid grid-cols-[1fr_auto_auto] items-center gap-4 border-t border-white/10 px-5 py-4 text-sm hover:bg-white/[0.03]"><span className="truncate text-slate-200">{workflow.file}</span><StatusPill status={workflow.status} /><span className="text-slate-300">${Number(workflow.totalCost || 0).toFixed(2)}</span></Link>)}</div>}
      </section>
    </AppShell>
  );
}

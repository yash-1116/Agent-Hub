"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell, PageHeading, StatusPill, EmptyState } from "../../components/AppShell";
import { apiGet } from "../../components/api";

export default function AgentDetailsPage() {
  const { id } = useParams();
  const [agent, setAgent] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { if (id) apiGet(`/api/agents/${id}`).then((data) => setAgent(data.agent)).catch((err) => setError(err.message)); }, [id]);
  if (error) return <AppShell eyebrow="AGENT DETAIL"><EmptyState title="Agent unavailable" description={error} action={<Link href="/agents" className="mt-5 inline-flex rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-[#07111f]">Back to agents</Link>} /></AppShell>;
  if (!agent) return <AppShell eyebrow="AGENT DETAIL"><p className="text-sm text-slate-500">Loading agent...</p></AppShell>;
  return <AppShell eyebrow="AGENT DETAIL"><PageHeading eyebrow={agent.category} title={agent.name} description={agent.description} action={<StatusPill status="Online" />} /><div className="grid max-w-4xl gap-5 md:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-[#0b1b2d] p-6"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Capabilities</p><ul className="mt-6 space-y-4 text-sm text-slate-300"><li>✓ Specialized document processing</li><li>✓ Workflow-ready API endpoint</li><li>✓ x402 usage billing</li><li>✓ Persisted invocation history</li></ul></div><div className="rounded-2xl border border-white/10 bg-[#0b1b2d] p-6"><p className="text-xs uppercase tracking-[0.18em] text-slate-500">Usage</p><p className="mt-5 text-3xl font-semibold text-white">0.01 USDC</p><p className="mt-1 text-sm text-slate-500">per use on Algorand Testnet</p><p className="mt-8 text-xs text-slate-500">Successful invocations</p><p className="mt-1 text-lg text-white">{agent.successfulInvocations || 0}</p><Link href="/workflow" className="mt-8 inline-flex rounded-xl bg-cyan-300 px-5 py-3 text-sm font-semibold text-[#07111f]">Run this agent</Link></div></div></AppShell>;
}
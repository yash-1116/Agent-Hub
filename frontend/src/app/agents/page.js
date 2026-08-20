"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell, PageHeading, StatusPill, EmptyState } from "../components/AppShell";
import { apiGet } from "../components/api";

const USER_PRICE = "0.01 USDC";

export default function AgentsPage() {
  const [agents, setAgents] = useState([]);
  const [health, setHealth] = useState({});
  const [error, setError] = useState("");
  useEffect(() => { Promise.all([apiGet("/api/agents"), apiGet("/api/health/agents")]).then(([data, healthData]) => { setAgents(data.agents || []); setHealth(Object.fromEntries((healthData.agents || []).map((item) => [item.name, item]))); }).catch((err) => setError(err.message)); }, []);
  return <AppShell eyebrow="AGENT MARKETPLACE"><PageHeading eyebrow="Available services" title="Choose your processing team" description="Specialized agents that turn raw documents into usable decisions." />{error && <div className="mb-6 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</div>}{agents.length === 0 ? <EmptyState title="No agents available" description="The marketplace is waiting for registered agents." /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{agents.map((agent) => <article key={agent._id} className="rounded-2xl border border-white/10 bg-[#0b1b2d] p-6"><div className="flex items-center justify-between"><span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-wider text-cyan-200">{agent.category}</span><StatusPill status={health[agent.name]?.status || "offline"} /></div><h2 className="mt-10 text-xl font-semibold text-white">{agent.name}</h2><p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">{agent.description}</p><div className="mt-8 flex items-end justify-between border-t border-white/10 pt-5"><div><p className="text-xs text-slate-500">Price per use</p><p className="mt-1 text-lg font-semibold text-white">{USER_PRICE}</p></div><Link href="/workflow" className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-[#07111f]">Run agent</Link></div></article>)}</div>}</AppShell>;
}

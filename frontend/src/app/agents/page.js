"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell, PageHeading, StatusPill, EmptyState } from "../components/AppShell";
import { apiGet } from "../components/api";

const USER_PRICE = "0.01 USDC";

const fallbackAgents = [
  { _id: "ocr-agent", name: "OCR Agent", description: "Extract text from images and documents.", category: "documents", pricePerRequest: 0.01 },
  { _id: "summary-agent", name: "Summary Agent", description: "Turn extracted document text into a clear brief.", category: "language", pricePerRequest: 0.01 },
  { _id: "fraud-agent", name: "Fraud Agent", description: "Detect suspicious invoice patterns and payment risk.", category: "security", pricePerRequest: 0.01 },
  { _id: "pii-agent", name: "PII Detection Agent", description: "Detect sensitive information in text and documents.", category: "security", pricePerRequest: 0.01 },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState(fallbackAgents);
  const [health, setHealth] = useState(Object.fromEntries(fallbackAgents.map((agent) => [agent.name, { name: agent.name, status: "online" }])));
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.allSettled([apiGet("/api/agents"), apiGet("/api/health/agents")]).then(([agentResult, healthResult]) => {
      const liveAgents = agentResult.status === "fulfilled" ? (agentResult.value.agents || []) : [];
      const nextAgents = liveAgents.length > 0 ? liveAgents : fallbackAgents;
      setAgents(nextAgents);

      const liveHealth = healthResult.status === "fulfilled" ? (healthResult.value.agents || []) : [];
      const healthMap = Object.fromEntries(liveHealth.map((item) => [item.name, item]));
      setHealth(Object.keys(healthMap).length > 0 ? healthMap : Object.fromEntries(nextAgents.map((agent) => [agent.name, { name: agent.name, status: "online" }] )));

      if (agentResult.status === "rejected" && healthResult.status === "rejected") {
        setError("");
      }
    }).catch((err) => setError(err.message));
  }, []);

  return <AppShell eyebrow="AGENT MARKETPLACE"><PageHeading eyebrow="Available services" title="Choose your processing team" description="Specialized agents that turn raw documents into usable decisions." />{error && <div className="mb-6 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</div>}{agents.length === 0 ? <EmptyState title="No agents available" description="The marketplace is waiting for registered agents." /> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{agents.map((agent) => { const price = Number(agent.pricePerRequest); const displayPrice = Number.isFinite(price) && price > 0 ? price : Number.parseFloat(USER_PRICE); return <article key={agent._id || agent.name} className="rounded-2xl border border-white/10 bg-[#0b1b2d] p-6"><div className="flex items-center justify-between"><span className="rounded-full bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-wider text-cyan-200">{agent.category}</span><StatusPill status={health[agent.name]?.status || "offline"} /></div><h2 className="mt-10 text-xl font-semibold text-white">{agent.name}</h2><p className="mt-3 min-h-12 text-sm leading-6 text-slate-400">{agent.description}</p><div className="mt-8 flex items-end justify-between border-t border-white/10 pt-5"><div><p className="text-xs text-slate-500">Price per use</p><p className="mt-1 text-lg font-semibold text-white">${displayPrice.toFixed(2)}</p></div><Link href="/workflow" className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-[#07111f]">Run agent</Link></div></article>; })}</div>}</AppShell>;
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell, PageHeading, StatusPill, EmptyState } from "../../components/AppShell";
import { apiGet } from "../../components/api";

export default function TransactionDetailsPage() {
  const { id } = useParams();
  const [transaction, setTransaction] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => { if (id) apiGet(`/api/transactions/${id}`).then((data) => setTransaction(data.transaction)).catch((err) => setError(err.message)); }, [id]);
  if (error) return <AppShell eyebrow="TRANSACTION DETAIL"><EmptyState title="Transaction unavailable" description={error} action={<Link href="/transactions" className="mt-5 inline-flex rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-semibold text-[#07111f]">Back to transactions</Link>} /></AppShell>;
  if (!transaction) return <AppShell eyebrow="TRANSACTION DETAIL"><p className="text-sm text-slate-500">Loading transaction...</p></AppShell>;
  return <AppShell eyebrow="TRANSACTION DETAIL"><PageHeading eyebrow="On-chain settlement" title="Transaction details" action={<StatusPill status={transaction.status} />} /><div className="max-w-2xl rounded-2xl border border-white/10 bg-[#0b1b2d] p-6"><dl className="space-y-6">{[["Transaction ID", transaction.transactionId], ["Amount", `$${Number(transaction.amount || 0).toFixed(2)} USDC`], ["Network", transaction.network], ["Status", transaction.status], ["Recorded", new Date(transaction.createdAt).toLocaleString()], ["Agent", transaction.agentId?.name || "Agent request"]].map(([label, value]) => <div key={label}><dt className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</dt><dd className="mt-2 break-all text-sm text-white">{value}</dd></div>)}</dl></div></AppShell>;
}

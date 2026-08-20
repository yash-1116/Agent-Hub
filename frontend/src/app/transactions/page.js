"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell, PageHeading, StatusPill, EmptyState } from "../components/AppShell";
import { apiGet } from "../components/api";

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => { apiGet("/api/transactions").then((data) => setTransactions(data.transactions || [])).catch((err) => setError(err.message)); }, []);
  return <AppShell eyebrow="TRANSACTIONS"><PageHeading eyebrow="Confirmed settlement records" title="Transactions" description="The on-chain transaction record behind each x402 payment." />{error && <div className="mb-6 rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</div>}{transactions.length === 0 ? <EmptyState title="No transactions yet" description="Confirmed x402 settlements will appear here." /> : <div className="overflow-hidden rounded-2xl border border-white/10"><div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 bg-white/[0.03] px-5 py-3 text-[11px] uppercase tracking-wider text-slate-500"><span>Transaction</span><span>Amount</span><span>Network</span><span>Status</span></div>{transactions.map((transaction) => <Link href={`/transactions/${transaction._id}`} key={transaction._id} className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 border-t border-white/10 px-5 py-4 text-sm hover:bg-white/[0.03]"><span className="truncate font-mono text-xs text-slate-300">{transaction.transactionId}</span><span className="text-white">${Number(transaction.amount || 0).toFixed(2)} USDC</span><span className="text-xs text-slate-500">{transaction.network}</span><StatusPill status={transaction.status} /></Link>)}</div>}</AppShell>;
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      localStorage.setItem("agenthub_token", data.token);
      router.push("/");
    } catch (submitError) { setError(submitError.message || "Could not sign in."); } finally { setLoading(false); }
  }

  return <main className="flex min-h-screen items-center justify-center bg-[#07111f] px-5 text-white"><div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1b2d] p-8"><p className="text-xs font-semibold tracking-[0.2em] text-cyan-300">AGENTHUB</p><h1 className="mt-8 text-3xl font-semibold">Welcome back</h1><p className="mt-3 text-sm text-slate-400">Sign in to manage your document workflows.</p><form onSubmit={submit} className="mt-8 space-y-4"><input required className="w-full rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm" placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /><input required className="w-full rounded-xl border border-white/10 bg-[#07111f] px-4 py-3 text-sm" placeholder="Password" type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />{error && <p className="rounded-xl bg-rose-400/10 p-3 text-sm text-rose-200">{error}</p>}<button disabled={loading} className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-[#07111f] disabled:opacity-50">{loading ? "Signing in..." : "Login"}</button></form><p className="mt-6 text-sm text-slate-500">Don&apos;t have an account? <Link href="/register" className="text-cyan-300">Sign up</Link></p></div></main>;
}

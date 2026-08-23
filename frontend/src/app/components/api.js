import { useEffect, useState } from "react";

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5000";

export async function apiGet(path) {
  const response = await fetch(`${BACKEND_URL}${path}`, { cache: "no-store" });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed: ${response.status}`);
  return data;
}

export function useLiveApi(path, responseKey, intervalMs = 5000) {
  const [data, setData] = useState(responseKey === "transaction" ? null : []);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!path) return undefined;

    let active = true;
    const load = () => apiGet(path)
      .then((response) => {
        if (!active) return;
        setData(response[responseKey] || (responseKey === "transaction" ? null : []));
        setError("");
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });

    load();
    const interval = setInterval(load, intervalMs);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [path, responseKey, intervalMs]);

  return { data, error };
}

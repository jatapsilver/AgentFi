const BACKEND_URL =
  import.meta.env.VITE_BACKEND_API_URL || "http://localhost:3000";

export async function fetchQuoteLogs() {
  const token = sessionStorage.getItem("auth_token");
  if (!token) return { error: "No auth token" };
  try {
    const res = await fetch(`${BACKEND_URL}/oneinch/logs`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error("Unauthorized");
      if (res.status === 404) throw new Error("Logs not found");
      throw new Error(`Unexpected error: ${res.status}`);
    }
    return await res.json();
  } catch (err: unknown) {
    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: "Unknown error" };
  }
}

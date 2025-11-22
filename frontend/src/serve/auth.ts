const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

export async function loginWithBackend({
  email,
  wallet,
}: {
  email: string;
  wallet: string;
}) {
  try {
    const res = await fetch(`${BACKEND_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, wallet }),
    });

    if (!res.ok) {
      if (res.status === 400) throw new Error("Invalid login data");
      if (res.status === 401) throw new Error("Unauthorized");
      if (res.status === 500) throw new Error("Server error");
      throw new Error(`Unexpected error: ${res.status}`);
    }

    const token = await res.text();
    if (!token) throw new Error("No token received");
    sessionStorage.setItem("auth_token", token);
    return token;
  } catch (err: unknown) {
    // Manejo de errores genéricos
    if (err instanceof Error) {
      return { error: err.message };
    }
    return { error: "Unknown error" };
  }
}

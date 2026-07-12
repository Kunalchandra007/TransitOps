import { FormEvent, useState } from "react";
import { Navigate } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function Login() {
  const { token, login } = useAuth();
  const [email, setEmail] = useState("manager@transitops.io");
  const [password, setPassword] = useState("TransitOps123");
  const [error, setError] = useState("");
  if (token) return <Navigate to="/" replace />;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await login(email, password);
    } catch {
      setError("Login failed. Seed the database or create a user first.");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <form onSubmit={submit} className="w-full max-w-sm glass-panel p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded bg-accent-live p-2 text-bg-base"><LockKeyhole className="h-5 w-5" /></div>
          <div><h1 className="text-xl font-bold font-display text-text-primary">TransitOps</h1><p className="text-sm text-text-muted">Fleet command sign-in</p></div>
        </div>
        <label className="text-sm font-medium text-text-primary">Email<input className="focus-ring mt-1 w-full px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="mt-4 block text-sm font-medium text-text-primary">Password<input type="password" className="focus-ring mt-1 w-full px-3 py-2" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <p className="mt-3 text-sm text-rose-500">{error}</p>}
        <button className="focus-ring mt-5 w-full rounded bg-accent-live px-4 py-2 font-semibold text-bg-base">Sign in</button>
      </form>
    </div>
  );
}

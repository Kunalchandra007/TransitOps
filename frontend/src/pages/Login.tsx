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
    <div className="grid min-h-screen place-items-center px-4 bg-bg-deep">
      <form onSubmit={submit} className="w-full max-w-sm bg-panel border border-hairline rounded-xl p-8">
        <div className="mb-8 flex items-center gap-4">
          <div className="rounded bg-accent p-2.5 text-bg-deep"><LockKeyhole className="h-6 w-6" /></div>
          <div><h1 className="text-2xl font-bold font-display uppercase tracking-wide text-ink-hi">TransitOps</h1><p className="text-sm text-ink-low">Fleet command sign-in</p></div>
        </div>
        <label className="text-sm font-medium text-ink-hi">Email<input className="mt-2 w-full bg-bg-deep border border-hairline text-ink-hi px-4 py-2.5 rounded-md focus:border-accent focus:outline-none transition-colors" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="mt-5 block text-sm font-medium text-ink-hi">Password<input type="password" className="mt-2 w-full bg-bg-deep border border-hairline text-ink-hi px-4 py-2.5 rounded-md focus:border-accent focus:outline-none transition-colors" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <p className="mt-4 text-sm text-status-bad">{error}</p>}
        <button className="mt-8 w-full rounded-md bg-accent hover:bg-accent/90 transition-colors px-4 py-3 font-semibold text-bg-deep uppercase tracking-wider text-sm">Sign in</button>
      </form>
    </div>
  );
}

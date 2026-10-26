import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { checkOwner } from "@/lib/admin";

export const Route = createFileRoute("/admin_/login")({
  ssr: false,
  head: () => ({ meta: [{ title: "Owner sign in — ZEON.CO" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: Login,
});

const schema = z.object({ email: z.string().trim().email().max(255), password: z.string().min(8).max(128) });
type Stage = "form" | "not-owner" | "claim";

function Login() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<Stage>("form");
  const [signedIn, setSignedIn] = useState(false);

  const afterAuth = async () => {
    if (await checkOwner()) { navigate({ to: "/admin", replace: true }); return; }
    const { data: exists } = await supabase.rpc("owner_exists");
    setSignedIn(true);
    setStage(exists ? "not-owner" : "claim");
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => data.user && afterAuth());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) return void toast.error("Enter a valid email and a password of at least 8 characters.");
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
        await afterAuth();
      } else {
        const { data, error } = await supabase.auth.signUp({ ...parsed.data, options: { emailRedirectTo: `${window.location.origin}/admin/login` } });
        if (error) throw error;
        if (!data.session) toast.success("Check your email to confirm your account, then sign in.");
        else await afterAuth();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const claim = async () => {
    setBusy(true);
    const { data, error } = await supabase.rpc("claim_initial_owner");
    setBusy(false);
    if (error || !data) {
      toast.error("This store already has an owner.");
      setStage("not-owner");
      return;
    }
    toast.success("You're now the store owner.");
    navigate({ to: "/admin", replace: true });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSignedIn(false);
    setStage("form");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary px-4">
      <div className="w-full max-w-sm border border-border bg-card p-8">
        <p className="font-display text-2xl font-black tracking-[0.18em]">ZEON<span className="text-accent">.</span>CO</p>
        <p className="eyebrow mt-1 text-muted-foreground">Owner dashboard</p>

        {stage === "form" && (
          <form onSubmit={submit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="eyebrow mb-1 block">Email</label>
              <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full border border-input bg-background px-3 py-3 text-base" required />
            </div>
            <div>
              <label htmlFor="pw" className="eyebrow mb-1 block">Password</label>
              <input id="pw" type="password" autoComplete={mode === "signin" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border border-input bg-background px-3 py-3 text-base" required minLength={8} />
            </div>
            <button disabled={busy} className="eyebrow w-full bg-foreground py-3.5 text-background disabled:opacity-50">{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>
            <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="w-full text-xs text-muted-foreground underline">
              {mode === "signin" ? "First time? Create the owner account" : "Already have an account? Sign in"}
            </button>
          </form>
        )}

        {stage === "claim" && signedIn && (
          <div className="mt-8 space-y-4 text-sm">
            <p>No owner has been set up for this store yet. Claim ownership to unlock the dashboard. This can only be done once.</p>
            <button onClick={claim} disabled={busy} className="eyebrow w-full bg-foreground py-3.5 text-background">Claim store ownership</button>
            <button onClick={signOut} className="w-full text-xs underline">Sign out</button>
          </div>
        )}

        {stage === "not-owner" && (
          <div className="mt-8 space-y-4 text-sm">
            <p>This account doesn't have access to the owner dashboard.</p>
            <button onClick={signOut} className="eyebrow w-full border border-foreground py-3">Sign out</button>
          </div>
        )}
      </div>
    </div>
  );
}

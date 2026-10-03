"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ApiError, api } from "@/lib/api";
import { Icon } from "./icon";

type Screen = "login" | "register" | "verify" | "forgot" | "reset";
const copy: Record<Screen, { title: string; subtitle: string }> = {
  login: { title: "Welcome back.", subtitle: "Everything moving through your account, all in one place." },
  register: { title: "A better way to deliver.", subtitle: "Create an account. It only takes a moment." },
  verify: { title: "Check your inbox.", subtitle: "Enter the six-digit code we sent to your email." },
  forgot: { title: "A quick reset.", subtitle: "We’ll send a short-lived code if an account exists." },
  reset: { title: "Choose a new password.", subtitle: "Your reset code expires after 15 minutes." },
};

export function AuthScreen({ screen }: { screen: Screen }) {
  const router = useRouter();
  const [kind, setKind] = useState<"customer" | "merchant">("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const heading = copy[screen];
  const inputClass = "form-input";

  useEffect(() => {
    if (screen === "verify") setEmail(sessionStorage.getItem("pace_verification_email") || "");
    if (screen === "reset") setEmail(sessionStorage.getItem("pace_reset_email") || "");
  }, [screen]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setNotice(""); setBusy(true);
    try {
      if (screen === "login") {
        await api.login(email, password);
        router.replace("/dashboard");
        router.refresh();
      } else if (screen === "register") {
        await api.post("/auth/register", { name, email, password, ...(phone ? { phone } : {}), ...(kind === "merchant" ? { merchantName } : {}) });
        sessionStorage.setItem("pace_verification_email", email.trim().toLowerCase());
        setNotice("Verification code sent. Check your inbox, then enter the six-digit code here.");
        router.push("/verify");
      } else if (screen === "verify") {
        const targetEmail = email || sessionStorage.getItem("pace_verification_email") || "";
        await api.post("/auth/verify-email", { email: targetEmail, code });
        sessionStorage.removeItem("pace_verification_email");
        setNotice("Email verified. Sign in to continue.");
        router.push("/sign-in?verified=1");
      } else if (screen === "forgot") {
        await api.post("/auth/forgot-password", { email });
        sessionStorage.setItem("pace_reset_email", email.trim().toLowerCase());
        setNotice("If an account exists, a reset code was sent to its email.");
        router.push("/reset-password");
      } else {
        const targetEmail = email || sessionStorage.getItem("pace_reset_email") || "";
        await api.post("/auth/reset-password", { email: targetEmail, code, password });
        sessionStorage.removeItem("pace_reset_email");
        setNotice("Password changed. You can sign in with your new password.");
        router.push("/sign-in?reset=1");
      }
    } catch (err) { setError(err instanceof ApiError ? err.message : "অনুরোধটি সম্পন্ন হয়নি। আবার চেষ্টা করুন।"); }
    finally { setBusy(false); }
  }

  async function resend() {
    const targetEmail = email || sessionStorage.getItem("pace_verification_email") || "";
    if (!targetEmail) return setError("আগে account-এর email দিন।");
    setBusy(true); setError("");
    try { await api.post("/auth/resend-verification", { email: targetEmail }); setNotice("If the account is pending, a fresh verification email is on its way."); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Email পাঠানো যায়নি।"); }
    finally { setBusy(false); }
  }

  return <main className="auth-shell">
    <aside className="auth-story"><Link className="brand" href="/"><span className="brand-symbol"><Icon name="arrow" size={18} /></span>pace</Link><div className="auth-story-text"><div className="eyebrow">A calmer way to deliver</div><h2>Good things are on their way.</h2><p>Bookings, tracking and updates that just make sense. Keep every delivery moving without losing sight of the details.</p></div><div className="story-quote">“It’s lovely to know where every order is, without chasing for an update.”<strong>A little more peace of mind, every day</strong></div></aside>
    <section className="auth-main"><div className="auth-card"><div className="eyebrow">Your Pace workspace</div><h1>{heading.title}</h1><p className="auth-subtitle">{heading.subtitle}</p>
      {screen === "register" && <div className="role-switch"><button type="button" onClick={() => setKind("customer")} className={kind === "customer" ? "role-choice selected" : "role-choice"}><Icon name="user" size={16} /> Customer</button><button type="button" onClick={() => setKind("merchant")} className={kind === "merchant" ? "role-choice selected" : "role-choice"}><Icon name="box" size={16} /> Merchant</button></div>}
      {error && <div className="notice notice-error" role="alert"><Icon name="close" size={15} />{error}</div>}{notice && <div className="notice" role="status"><Icon name="check" size={15} />{notice}</div>}
      <form className="form-stack" onSubmit={submit}>
        {screen === "register" && <label className="form-label">Full name<input className={inputClass} autoComplete="name" required minLength={2} placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} /></label>}
        {(screen === "login" || screen === "register" || screen === "verify" || screen === "forgot" || screen === "reset") && <label className="form-label">Email address<input className={inputClass} autoComplete="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></label>}
        {screen === "register" && <><label className="form-label">Phone number <span className="form-help">Optional</span><input className={inputClass} autoComplete="tel" inputMode="tel" placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} /></label>{kind === "merchant" && <label className="form-label">Store or business name<input className={inputClass} required minLength={2} placeholder="Your store name" value={merchantName} onChange={(e) => setMerchantName(e.target.value)} /></label>}</>}
        {screen === "verify" && <label className="form-label">Six-digit verification code<input className={inputClass} required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} /></label>}
        {screen === "reset" && <label className="form-label">Six-digit reset code<input className={inputClass} required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} /></label>}
        {(screen === "login" || screen === "register" || screen === "reset") && <label className="form-label">{screen === "reset" ? "New password" : "Password"}<input className={inputClass} type="password" autoComplete={screen === "login" ? "current-password" : "new-password"} required minLength={8} placeholder="At least 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} /></label>}
        {screen === "login" && <div className="form-row"><span className="form-help">Your session stays on this device.</span><Link className="text-link" href="/forgot-password">Forgot password?</Link></div>}
        {screen === "register" && <p className="form-help">{kind === "customer" ? "Already a Pace customer? Use the same email your merchant has for your deliveries to see them in your account." : "We’ll create your merchant workspace after you verify your email."}</p>}
        <button className="btn auth-submit" type="submit" disabled={busy}>{busy ? <><span className="spinner" />Working on it…</> : <>{screen === "login" ? "Sign in" : screen === "register" ? "Create my account" : screen === "verify" ? "Verify email" : screen === "forgot" ? "Send reset code" : "Update password"}<Icon name="arrowRight" size={15} /></>}</button>
      </form>
      {screen === "verify" && <div className="resend-row"><span className="form-help">Didn’t receive it?</span><button className="text-link" type="button" disabled={busy} onClick={resend}>Resend code</button></div>}
      <div className="auth-footer">{screen === "login" ? <>New to Pace? <Link className="text-link" href="/register">Create an account</Link></> : screen === "register" ? <>Already have an account? <Link className="text-link" href="/sign-in">Sign in</Link></> : <>Remembered your password? <Link className="text-link" href="/sign-in">Sign in</Link></>}</div>
      <div className="auth-secure"><Icon name="check" size={13} /> Your details are protected and only used for your deliveries.</div>
    </div></section>
  </main>;
}

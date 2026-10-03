"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Icon } from "@/components/icon";
import { ApiError, api, type Parcel } from "@/lib/api";
import { date, title } from "@/lib/format";

export default function HomePage() {
  const [tracking, setTracking] = useState("");
  const [parcel, setParcel] = useState<Parcel | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function track(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setParcel(null); setLoading(true);
    try { setParcel(await api.get<Parcel>(`/parcels/track/${encodeURIComponent(tracking.trim())}`)); }
    catch (err) { setError(err instanceof ApiError ? err.message : "Tracking পাওয়া যায়নি। নম্বরটি আবার দেখুন।"); }
    finally { setLoading(false); }
  }

  return <main className="marketing-wrap">
    <header className="marketing-nav"><Link className="brand" href="/"><span className="brand-symbol"><Icon name="arrow" size={19} /></span>pace</Link><nav className="nav-links"><a href="#why-pace">Why Pace</a><a href="#track">Track a parcel</a><a href="#for-teams">For delivery teams</a></nav><div className="nav-actions"><Link className="btn btn-light" href="/sign-in">Sign in</Link><Link className="btn" href="/register">Create account <Icon name="arrowRight" size={15} /></Link></div></header>

    <section className="hero"><div className="hero-copy"><div className="eyebrow">The friendlier delivery platform</div><h1>Good things are on <em>their way.</em></h1><p>From the shop to the doorstep, every parcel moves with care, clarity, and a little more calm.</p><div className="hero-buttons"><Link className="btn" href="/register">Get started <Icon name="arrowRight" size={15} /></Link><a className="btn btn-light" href="#track">Track a parcel <Icon name="search" size={15} /></a></div><div className="hero-note"><span className="live-dot" /><span><strong>Real-time updates</strong> at every step of the journey</span></div></div>
      <div className="hero-art" aria-label="A parcel moving safely between two hubs"><div className="art-halo" /><div className="pin-mark pin-origin"><Icon name="pin" size={15} /></div><div className="pin-mark pin-destination"><Icon name="pin" size={15} /></div><div className="delivery-card"><div className="delivery-card-top"><div><span className="delivery-card-label">ON ITS WAY TO YOU</span><strong className="delivery-card-code">PACE–04821</strong></div><span className="status-pill">IN TRANSIT</span></div><div className="progress-line"><i className="progress-point one" /><i className="progress-point two" /><i className="progress-point three" /></div><div className="route-labels"><span>Dhaka hub</span><span>Sorting</span><span>Your door</span></div></div><div className="floating-chip chip-left"><span className="live-dot" /> Safely on the move</div><div className="floating-chip chip-bottom"><Icon name="spark" size={15} /> Your next update is close</div></div>
    </section>

    <section id="track" className="tracking-section"><div className="section-head"><div><h2>Wondering where it is?</h2><p>Pop in your tracking number. We’ll take a look.</p></div><span className="status-pill">LIVE TRACKING</span></div><form className="tracking-search" onSubmit={track}><Icon name="search" size={17} className="search-icon" /><input aria-label="Tracking number" required minLength={4} placeholder="e.g. CLP0AB12CD" value={tracking} onChange={(e) => setTracking(e.target.value)} /><button className="btn btn-small" type="submit" disabled={loading}>{loading ? <span className="spinner" /> : "Find my parcel"}</button></form>{error && <p className="track-error">{error}</p>}{parcel && <div className="track-result"><div><span className="form-help">PARCEL STATUS</span><h3>{parcel.trackingNumber} <span className="status-pill">{title(parcel.status)}</span></h3><p>Last updated {date(parcel.trackingEvents?.at(-1)?.createdAt ?? parcel.createdAt)}</p></div><Link className="btn btn-light btn-small" href="/sign-in">Open your account <Icon name="arrowRight" size={13} /></Link>{parcel.trackingEvents?.length ? <div className="track-event">{parcel.trackingEvents.map((item, i) => <div className="track-event-item" key={`${item.status}-${item.createdAt}`}><i className={i === parcel.trackingEvents!.length - 1 ? "timeline-dot" : "timeline-dot muted-dot"} /><span><strong>{title(item.status)}</strong><small>{item.note || item.location || date(item.createdAt)} · {date(item.createdAt)}</small></span></div>)}</div> : null}</div>}</section>

    <section className="trust-row"><span><Icon name="check" size={14} /><strong>Updates that make sense</strong></span><span><Icon name="pin" size={14} />Hub-to-door visibility</span><span><Icon name="wallet" size={14} />Straightforward payments</span><span><Icon name="spark" size={14} />Help when you need it</span></section>

    <section id="why-pace" className="feature-grid"><article className="feature-card"><span className="feature-icon"><Icon name="search" /></span><h3>Know where things stand</h3><p>Clear tracking updates keep you in the loop without a dozen phone calls.</p></article><article id="for-teams" className="feature-card"><span className="feature-icon"><Icon name="box" /></span><h3>A calmer day for teams</h3><p>Merchants, hubs and riders see the work that belongs to them.</p></article><article className="feature-card"><span className="feature-icon"><Icon name="wallet" /></span><h3>Payments, made clearer</h3><p>See COD and online payment status next to the delivery they belong to.</p></article></section>

    <footer className="landing-footer"><Link className="brand footer-brand" href="/"><span className="brand-symbol"><Icon name="arrow" size={16} /></span>pace</Link><span>Thoughtful deliveries, from start to finish.</span><span>© {new Date().getFullYear()} Pace Logistics</span></footer>
  </main>;
}

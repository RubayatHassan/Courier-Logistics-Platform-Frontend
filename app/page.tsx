"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icon";
import { ApiError, api, type Parcel } from "@/lib/api";
import { date, title } from "@/lib/format";

export default function HomePage() {
  const [tracking, setTracking] = useState("");
  const [submittedTracking, setSubmittedTracking] = useState("");
  const {
    data: parcel,
    error,
    isFetching,
  } = useQuery({
    queryKey: ["public-parcel-tracking", submittedTracking],
    queryFn: () => api.get<Parcel>(`/parcels/track/${encodeURIComponent(submittedTracking)}`),
    enabled: Boolean(submittedTracking),
    retry: false,
  });

  function track(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmittedTracking(tracking.trim());
  }

  const trackingError = error instanceof ApiError ? error.message : error ? "Tracking পাওয়া যায়নি। নম্বরটি আবার দেখুন।" : "";

  return (
    <main className="marketing-wrap">
      <header className="marketing-nav">
        <Link className="brand" href="/">
          <span className="brand-symbol">
            <Icon name="arrow" size={19} />
          </span>
          pace
        </Link>
        <nav className="nav-links">
          <a href="#journey">How it works</a>
          <a href="#track">Track a parcel</a>
          <a href="#for-customers">For customers</a>
          <a href="#for-teams">For teams</a>
        </nav>
        <div className="nav-actions">
          <Link className="btn btn-light" href="/sign-in">
            Sign in
          </Link>
          <Link className="btn" href="/register">
            Create account <Icon name="arrowRight" size={15} />
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">The friendlier delivery platform</div>
          <h1>
            Good things are on <em>their way.</em>
          </h1>
          <p>From the shop to the doorstep, every parcel moves with care, clarity, and a little more calm.</p>
          <div className="hero-buttons">
            <Link className="btn" href="/register">
              Get started <Icon name="arrowRight" size={15} />
            </Link>
            <a className="btn btn-light" href="#track">
              Track a parcel <Icon name="search" size={15} />
            </a>
          </div>
          <div className="hero-note">
            <span className="live-dot" />
            <span>
              <strong>Real-time updates</strong> at every step of the journey
            </span>
          </div>
        </div>
        <div className="hero-art" role="img" aria-label="A parcel moving safely between two hubs">
          <div className="art-halo" />
          <div className="pin-mark pin-origin">
            <Icon name="pin" size={15} />
          </div>
          <div className="pin-mark pin-destination">
            <Icon name="pin" size={15} />
          </div>
          <div className="delivery-card">
            <div className="delivery-card-top">
              <div>
                <span className="delivery-card-label">ON ITS WAY TO YOU</span>
                <strong className="delivery-card-code">PACE–04821</strong>
              </div>
              <span className="status-pill">IN TRANSIT</span>
            </div>
            <div className="progress-line">
              <i className="progress-point one" />
              <i className="progress-point two" />
              <i className="progress-point three" />
            </div>
            <div className="route-labels">
              <span>Dhaka hub</span>
              <span>Sorting</span>
              <span>Your door</span>
            </div>
          </div>
          <div className="floating-chip chip-left">
            <span className="live-dot" /> Safely on the move
          </div>
          <div className="floating-chip chip-bottom">
            <Icon name="spark" size={15} /> Your next update is close
          </div>
        </div>
      </section>

      <section id="track" className="tracking-section">
        <div className="section-head">
          <div>
            <h2>Wondering where it is?</h2>
            <p>Pop in your tracking number. We’ll take a look.</p>
          </div>
          <span className="status-pill">LIVE TRACKING</span>
        </div>
        <form className="tracking-search" onSubmit={track}>
          <Icon name="search" size={17} className="search-icon" />
          <input
            aria-label="Tracking number"
            required
            minLength={4}
            placeholder="e.g. CLP0AB12CD"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
          />
          <button className="btn btn-small" type="submit" disabled={isFetching}>
            {isFetching ? <span className="spinner" /> : "Find my parcel"}
          </button>
        </form>
        {trackingError && <p className="track-error">{trackingError}</p>}
        {parcel && (
          <div className="track-result">
            <div>
              <span className="form-help">PARCEL STATUS</span>
              <h3>
                {parcel.trackingNumber} <span className="status-pill">{title(parcel.status)}</span>
              </h3>
              <p>Last updated {date(parcel.trackingEvents?.at(-1)?.createdAt ?? parcel.createdAt)}</p>
            </div>
            <Link className="btn btn-light btn-small" href="/sign-in">
              Open your account <Icon name="arrowRight" size={13} />
            </Link>
            {parcel.trackingEvents?.length ? (
              <div className="track-event">
                {parcel.trackingEvents.map((item, i) => (
                  <div className="track-event-item" key={`${item.status}-${item.createdAt}`}>
                    <i
                      className={
                        i === (parcel.trackingEvents?.length ?? 0) - 1 ? "timeline-dot" : "timeline-dot muted-dot"
                      }
                    />
                    <span>
                      <strong>{title(item.status)}</strong>
                      <small>
                        {item.note || item.location || date(item.createdAt)} · {date(item.createdAt)}
                      </small>
                    </span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section id="journey" className="journey-section">
        <div className="journey-heading">
          <div>
            <div className="eyebrow">Simple from the start</div>
            <h2>One clear journey, every time.</h2>
            <p>Each hand-off is recorded, so you know what happens next.</p>
          </div>
          <span className="journey-stamp">
            <Icon name="spark" size={19} /> Thoughtful delivery
          </span>
        </div>
        <div className="journey-steps">
          <article className="journey-step">
            <span className="step-number">01</span>
            <span className="step-icon">
              <Icon name="package" size={19} />
            </span>
            <h3>Parcel booked</h3>
            <p>The sender adds the pickup, delivery and recipient details.</p>
          </article>
          <article className="journey-step">
            <span className="step-number">02</span>
            <span className="step-icon">
              <Icon name="box" size={19} />
            </span>
            <h3>Sorted at the hub</h3>
            <p>Hub teams scan the parcel and route it to the right local team.</p>
          </article>
          <article className="journey-step">
            <span className="step-number">03</span>
            <span className="step-icon">
              <Icon name="truck" size={19} />
            </span>
            <h3>Out for delivery</h3>
            <p>A local rider takes it to the address and records the result.</p>
          </article>
          <article className="journey-step">
            <span className="step-number">04</span>
            <span className="step-icon">
              <Icon name="check" size={19} />
            </span>
            <h3>Delivered with clarity</h3>
            <p>The latest status and delivery updates stay easy to find.</p>
          </article>
        </div>
      </section>

      <section id="for-customers" className="customer-section">
        <div className="customer-copy">
          <div className="eyebrow">For the person receiving it</div>
          <h2>Your delivery, in your hands.</h2>
          <p>Sign in with the email linked to your parcel to follow its progress and manage the parts you can.</p>
          <Link className="btn" href="/sign-in">
            Open my deliveries <Icon name="arrowRight" size={15} />
          </Link>
        </div>
        <div className="customer-benefits">
          <div className="customer-benefit">
            <span>
              <Icon name="search" size={16} />
            </span>
            <div>
              <strong>See every update</strong>
              <small>Follow your parcel from the hub to your door.</small>
            </div>
          </div>
          <div className="customer-benefit">
            <span>
              <Icon name="close" size={16} />
            </span>
            <div>
              <strong>Cancel before pickup</strong>
              <small>If the parcel has not been picked up yet, request a cancellation in your account.</small>
            </div>
          </div>
          <div className="customer-benefit">
            <span>
              <Icon name="wallet" size={16} />
            </span>
            <div>
              <strong>Pay COD securely</strong>
              <small>When a parcel is out for delivery, pay its COD online when available.</small>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-row">
        <span>
          <Icon name="check" size={14} />
          <strong>Updates that make sense</strong>
        </span>
        <span>
          <Icon name="pin" size={14} />
          Hub-to-door visibility
        </span>
        <span>
          <Icon name="wallet" size={14} />
          Straightforward payments
        </span>
        <span>
          <Icon name="spark" size={14} />
          Help when you need it
        </span>
      </section>

      <section id="why-pace" className="feature-grid">
        <article className="feature-card">
          <span className="feature-icon">
            <Icon name="search" />
          </span>
          <h3>Know where things stand</h3>
          <p>Clear tracking updates keep you in the loop without a dozen phone calls.</p>
        </article>
        <article id="for-teams" className="feature-card">
          <span className="feature-icon">
            <Icon name="box" />
          </span>
          <h3>A calmer day for teams</h3>
          <p>Merchants, hubs and riders see the work that belongs to them.</p>
        </article>
        <article className="feature-card">
          <span className="feature-icon">
            <Icon name="wallet" />
          </span>
          <h3>Payments, made clearer</h3>
          <p>See COD and online payment status next to the delivery they belong to.</p>
        </article>
        <article className="feature-card">
          <span className="feature-icon">
            <Icon name="pin" />
          </span>
          <h3>Every handoff has a place</h3>
          <p>Hub teams can receive transfers and route each parcel to its next stop.</p>
        </article>
        <article className="feature-card">
          <span className="feature-icon">
            <Icon name="truck" />
          </span>
          <h3>Local teams stay in sync</h3>
          <p>Riders see their assigned work and record delivery attempts as they happen.</p>
        </article>
        <article className="feature-card">
          <span className="feature-icon">
            <Icon name="users" />
          </span>
          <h3>One view for your team</h3>
          <p>Merchants and operations teams get a workspace shaped around their daily work.</p>
        </article>
      </section>

      <section className="closing-cta">
        <div>
          <span className="eyebrow">Ready when you are</span>
          <h2>Make the next delivery feel easier.</h2>
          <p>Start with an account, or check on a parcel already on its way.</p>
        </div>
        <div className="closing-actions">
          <Link className="btn" href="/register">
            Create an account <Icon name="arrowRight" size={15} />
          </Link>
          <a className="btn btn-light" href="#track">
            Track a parcel <Icon name="search" size={15} />
          </a>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-main">
          <div className="footer-brand-block">
            <Link className="brand footer-brand" href="/">
              <span className="brand-symbol">
                <Icon name="arrow" size={16} />
              </span>
              pace
            </Link>
            <p>Thoughtful deliveries, from start to finish.</p>
          </div>
          <div className="footer-links">
            <div>
              <strong>Explore</strong>
              <a href="#journey">How it works</a>
              <a href="#for-customers">For customers</a>
              <a href="#for-teams">For teams</a>
              <Link href="/docs">API documentation</Link>
            </div>
            <div>
              <strong>Your account</strong>
              <Link href="/sign-in">Sign in</Link>
              <Link href="/register">Create account</Link>
              <a href="#track">Track a parcel</a>
            </div>
            <div>
              <strong>Need a hand?</strong>
              <a href="mailto:support@example.com">Contact support</a>
              <span>Bangladesh delivery network</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Pace Logistics</span>
          <span>Made for smoother handoffs.</span>
        </div>
      </footer>
    </main>
  );
}

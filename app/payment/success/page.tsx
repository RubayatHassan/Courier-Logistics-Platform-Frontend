"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { title } from "@/lib/format";
import { Icon } from "@/components/icon";

type CheckoutStatus = {
  paymentStatus: "PENDING" | "PAID" | "FAILED";
  parcelStatus: string;
  trackingNumber: string;
};

type ResultState = "checking" | "delivered" | "paid" | "processing" | "failed" | "missing";

export default function PaymentSuccessPage() {
  const [result, setResult] = useState<ResultState>("checking");
  const [details, setDetails] = useState<CheckoutStatus | null>(null);

  useEffect(() => {
    let active = true;
    let timeout: number | undefined;
    const sessionId = new URLSearchParams(window.location.search).get("session_id");

    if (!sessionId) {
      setResult("missing");
      return () => {
        active = false;
      };
    }

    let attempts = 0;
    const checkStatus = async () => {
      attempts += 1;
      try {
        const status = await api.get<CheckoutStatus>(
          `/payments/stripe/checkout/${encodeURIComponent(sessionId)}/status`,
        );
        if (!active) return;
        setDetails(status);
        if (status.paymentStatus === "PAID") {
          setResult(status.parcelStatus === "DELIVERED" ? "delivered" : "paid");
          return;
        }
        if (status.paymentStatus === "FAILED") {
          setResult("failed");
          return;
        }
      } catch {
        if (!active) return;
      }

      if (attempts >= 12) {
        setResult("processing");
        return;
      }
      timeout = window.setTimeout(checkStatus, 5000);
    };

    void checkStatus();
    return () => {
      active = false;
      if (timeout) window.clearTimeout(timeout);
    };
  }, []);

  const copy = {
    checking: {
      heading: "Confirming your payment…",
      message: "We’re checking Stripe and updating your delivery status. This usually takes a few seconds.",
      icon: "check" as const,
    },
    delivered: {
      heading: "Payment received. Parcel delivered.",
      message: "Your online payment is confirmed and the parcel status is now delivered.",
      icon: "check" as const,
    },
    paid: {
      heading: "Payment received.",
      message: `Your payment is confirmed. Current delivery status: ${title(details?.parcelStatus ?? "processing")}.`,
      icon: "check" as const,
    },
    processing: {
      heading: "Payment is still being confirmed.",
      message: "Your payment may have gone through. Check your deliveries again shortly before trying to pay again.",
      icon: "check" as const,
    },
    failed: {
      heading: "Payment was not completed.",
      message: "No successful payment was confirmed. You can return to your delivery and try again.",
      icon: "close" as const,
    },
    missing: {
      heading: "Payment reference is missing.",
      message: "Open this page from the Stripe checkout return link so we can verify your payment.",
      icon: "close" as const,
    },
  }[result];

  return (
    <main className="payment-result">
      <section className="payment-result-card" aria-live="polite">
        <span className="empty-mark">
          <Icon name={copy.icon} size={20} />
        </span>
        <div className="eyebrow">Secure checkout</div>
        <h1>{copy.heading}</h1>
        <p>{copy.message}</p>
        {details?.trackingNumber && (
          <p>
            Tracking number: <strong>{details.trackingNumber}</strong>
          </p>
        )}
        <div className="hero-buttons" style={{ justifyContent: "center", marginTop: 22 }}>
          <Link className="btn" href="/dashboard">
            Back to my deliveries <Icon name="arrowRight" size={14} />
          </Link>
          <Link className="btn btn-light" href="/">
            Home
          </Link>
        </div>
      </section>
    </main>
  );
}

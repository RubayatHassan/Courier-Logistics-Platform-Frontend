import Link from "next/link";
import { Icon } from "@/components/icon";

export default function PaymentSuccessPage() {
  return <main className="payment-result"><section className="payment-result-card"><span className="empty-mark"><Icon name="check" size={20} /></span><div className="eyebrow">Secure checkout</div><h1>Thanks. We’re confirming your payment.</h1><p>Stripe has returned you to Pace. Your parcel will show the payment update as soon as the confirmation reaches our system.</p><div className="hero-buttons" style={{ justifyContent: "center", marginTop: 22 }}><Link className="btn" href="/dashboard">Back to my deliveries <Icon name="arrowRight" size={14} /></Link><Link className="btn btn-light" href="/">Home</Link></div></section></main>;
}

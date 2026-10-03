import Link from "next/link";
import { Icon } from "@/components/icon";

export default function PaymentCancelPage() {
  return <main className="payment-result"><section className="payment-result-card"><span className="empty-mark"><Icon name="wallet" size={20} /></span><div className="eyebrow">Checkout paused</div><h1>No payment was submitted.</h1><p>Your parcel remains in your Pace account. You can return to it and try secure checkout again whenever you’re ready.</p><div className="hero-buttons" style={{ justifyContent: "center", marginTop: 22 }}><Link className="btn" href="/dashboard">Return to my deliveries <Icon name="arrowRight" size={14} /></Link><Link className="btn btn-light" href="/">Home</Link></div></section></main>;
}

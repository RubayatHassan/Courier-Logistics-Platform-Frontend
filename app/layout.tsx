import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pace — parcel delivery, made simple",
  description: "Book, track and manage every delivery from one calm, connected workspace.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><div className="site-announcement"><span className="live-dot" /> Reliable deliveries across Bangladesh, made a little more human. <Link href="/register">Join Pace <span aria-hidden="true">↗</span></Link></div>{children}</body></html>;
}

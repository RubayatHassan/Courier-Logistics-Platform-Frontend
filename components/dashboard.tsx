"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ApiError,
  api,
  clearAccessToken,
  type Customer,
  type Hub,
  type Page,
  type Parcel,
  type Rider,
  type Role,
  type User,
} from "@/lib/api";
import { date, initials, money, title } from "@/lib/format";
import { Icon } from "./icon";
import { AdminOperations } from "./admin-operations";

type Section = "overview" | "parcels" | "inbound" | "customers" | "riders" | "payments" | "operations" | "profile";
type Transfer = { id: string; parcelId: string; transferredAt: string; fromHub?: Hub; toHub: Hub; parcel: Parcel };
type Payload = Page<Parcel>;
const states = [
  "CREATED",
  "PICKUP_ASSIGNED",
  "PICKED_UP",
  "AT_HUB",
  "IN_TRANSIT",
  "SORTING",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "DELIVERY_FAILED",
  "RESCHEDULED",
  "CANCELLED",
  "RETURNED",
  "LOST_DAMAGED",
];

function sectionLabel(section: Section, role?: Role) {
  return {
    overview: "Overview",
    operations: "Operations",
    profile: "Profile",
    parcels: role === "ADMIN" || role === "SUPER_ADMIN" ? "Network parcels" : "My parcels",
    inbound: "Inbound transfers",
    customers: "Customers",
    riders: "Local riders",
    payments: "Payments",
  }[section];
}
function roleLabel(role: Role) {
  return {
    CUSTOMER: "Customer",
    MERCHANT: "Merchant",
    HUB_MANAGER: "Hub manager",
    RIDER: "Delivery rider",
    ADMIN: "Administrator",
    SUPER_ADMIN: "Administrator",
  }[role];
}
function statusTone(status: string) {
  return ["DELIVERED", "PAID"].includes(status)
    ? "tone-green"
    : [
          "IN_TRANSIT",
          "OUT_FOR_DELIVERY",
          "PICKED_UP",
          "AT_HUB",
          "PICKUP_ASSIGNED",
          "PENDING",
          "SORTING",
          "RESCHEDULED",
        ].includes(status)
      ? "tone-orange"
      : "tone-gray";
}
function Status({ value }: { value: string }) {
  return (
    <span className={`status-badge ${statusTone(value)}`}>
      <i className="status-dot" />
      {title(value)}
    </span>
  );
}

export function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [destinationHubs, setDestinationHubs] = useState<Hub[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [section, setSection] = useState<Section>("overview");
  const [selected, setSelected] = useState<Parcel | null>(null);
  const [dialog, setDialog] = useState<
    "book" | "customer" | "cancel" | "origin" | "dispatch" | "assign" | "checkout" | "status" | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ text: string; error?: boolean } | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [bookingCustomerId, setBookingCustomerId] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [weight, setWeight] = useState("1000");
  const [cod, setCod] = useState("0");
  const [originHub, setOriginHub] = useState("");
  const [destinationHub, setDestinationHub] = useState("");
  const [riderId, setRiderId] = useState("");
  const [reason, setReason] = useState("");
  const [checkoutPhone, setCheckoutPhone] = useState("");
  const [nextStatus, setNextStatus] = useState("DELIVERED");
  const [statusNote, setStatusNote] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileWorking, setProfileWorking] = useState(false);

  const notify = useCallback((text: string, isError = false) => {
    setToast({ text, error: isError });
    window.setTimeout(() => setToast(null), 4500);
  }, []);

  const signOut = useCallback(async () => {
    await api.logout().catch(() => clearAccessToken());
    router.replace("/sign-in");
  }, [router]);

  const loadData = useCallback(
    async (profile: User | null) => {
      if (!profile) return;
      setError("");
      try {
        if (profile.role === "CUSTOMER") {
          const result = await api.get<Payload>("/customers/me/parcels?page=1&limit=50");
          setParcels(result.items);
        } else {
          const result = await api.get<Payload>("/parcels?page=1&limit=50");
          setParcels(result.items);
          if (profile.role === "MERCHANT") {
            const [people, locations] = await Promise.all([
              api.get<Customer[]>("/customers"),
              api.get<Hub[]>("/operations/hubs"),
            ]);
            setCustomers(people);
            setHubs(locations);
          } else if (profile.role === "HUB_MANAGER" || profile.role === "ADMIN") {
            const [locations, destinations, inbound] = await Promise.all([
              api.get<Hub[]>("/operations/hubs"),
              api.get<Hub[]>("/operations/transfer-destinations"),
              api.get<Transfer[]>("/operations/inbound-transfers"),
            ]);
            setHubs(locations);
            setDestinationHubs(destinations);
            setTransfers(inbound);
          }
        }
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          clearAccessToken();
          router.replace("/sign-in");
          return;
        }
        if (e instanceof ApiError && e.status === 403 && profile.role !== "CUSTOMER") {
          // A manager without a mapped hub can still see its own scoped parcel list.
          setTransfers([]);
        } else setError(e instanceof ApiError ? e.message : "তথ্য লোড করা যায়নি। আবার চেষ্টা করুন।");
      }
    },
    [router],
  );

  useEffect(() => {
    let alive = true;
    api
      .me()
      .then(async (profile) => {
        if (!alive) return;
        setUser(profile);
        setProfileName(profile.name);
        setProfilePhone(profile.phone ?? "");
        await loadData(profile);
      })
      .catch(() => {
        clearAccessToken();
        router.replace("/sign-in");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [loadData, router]);

  const permissions = user?.role;
  const navSections = useMemo<Section[]>(() => {
    if (!permissions) return ["overview", "parcels"];
    if (permissions === "CUSTOMER") return ["overview", "parcels", "payments", "profile"];
    if (permissions === "MERCHANT") return ["overview", "parcels", "customers", "payments", "profile"];
    if (permissions === "HUB_MANAGER") return ["overview", "parcels", "inbound", "riders", "profile"];
    if (permissions === "ADMIN") return ["overview", "parcels", "inbound", "operations", "profile"];
    if (permissions === "SUPER_ADMIN") return ["overview", "parcels", "operations", "profile"];
    if (permissions === "RIDER") return ["overview", "parcels", "profile"];
    return ["overview", "parcels", "inbound", "profile"];
  }, [permissions]);

  const total = parcels.length;
  const active = parcels.filter(
    (p) => !["DELIVERED", "CANCELLED", "RETURNED", "LOST_DAMAGED"].includes(p.status),
  ).length;
  const delivered = parcels.filter((p) => p.status === "DELIVERED").length;
  const paid = parcels.filter((p) => p.payments?.some((payment) => payment.status === "PAID")).length;
  const visibleParcels = parcels.filter(
    (p) =>
      (filter === "ALL" || p.status === filter) &&
      `${p.trackingNumber} ${p.deliveryAddress ?? ""} ${p.customer?.name ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const openDialog = (kind: typeof dialog, parcel?: Parcel) => {
    if (parcel) setSelected(parcel);
    if (kind === "dispatch") setDestinationHub("");
    setError("");
    setDialog(kind);
  };

  async function submitCustomer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setWorking(true);
    setError("");
    try {
      const created = await api.post<Customer>("/customers", {
        name: customerName,
        phone: customerPhone,
        ...(customerEmail ? { email: customerEmail } : {}),
      });
      setCustomers((list) => [created, ...list]);
      setBookingCustomerId(created.id);
      setDialog("book");
      notify("Customer added. Start the parcel booking when ready.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Customer তৈরি হয়নি।");
    } finally {
      setWorking(false);
    }
  }

  async function submitBooking(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setWorking(true);
    setError("");
    try {
      const parcel = await api.post<Parcel>(
        "/parcels",
        {
          customerId: bookingCustomerId,
          pickupAddress,
          deliveryAddress,
          weightGrams: Number(weight),
          codAmount: Number(cod),
        },
        { "Idempotency-Key": crypto.randomUUID() },
      );
      if (originHub) await api.post(`/parcels/${parcel.id}/assign-origin-hub`, { hubId: originHub });
      setDialog(null);
      setCustomerName("");
      setPickupAddress("");
      setDeliveryAddress("");
      await loadData(user);
      notify(originHub ? "Parcel booked and assigned to the origin hub." : `Parcel ${parcel.trackingNumber} booked.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Parcel booking হয়নি।");
    } finally {
      setWorking(false);
    }
  }

  async function cancelParcel(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setWorking(true);
    setError("");
    try {
      await api.post(`/customers/me/parcels/${selected.id}/cancel`, { reason });
      setDialog(null);
      setSelected(null);
      setReason("");
      await loadData(user);
      notify("Parcel cancelled successfully.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Cancel request complete হয়নি।");
    } finally {
      setWorking(false);
    }
  }

  async function assignOriginHub(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected || !originHub) return;
    setWorking(true);
    setError("");
    try {
      const path = ["/parcels", selected.id, "assign-origin-hub"].join("/");
      await api.post(path, { hubId: originHub });
      setDialog(null);
      setSelected(null);
      setOriginHub("");
      await loadData(user);
      notify("Origin hub assigned. The hub team can now process this parcel.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Origin hub assign হয়নি।");
    } finally {
      setWorking(false);
    }
  }
  async function dispatchParcel(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setWorking(true);
    setError("");
    try {
      await api.post(`/parcels/${selected.id}/dispatch`, { destinationHubId: destinationHub });
      setDialog(null);
      setSelected(null);
      await loadData(user);
      notify("Parcel dispatched to the destination hub.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Dispatch complete হয়নি।");
    } finally {
      setWorking(false);
    }
  }

  async function assignRider(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setWorking(true);
    setError("");
    try {
      await api.post(`/parcels/${selected.id}/assign-rider`, { riderId });
      setDialog(null);
      setSelected(null);
      await loadData(user);
      notify("Local rider assigned.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Rider assign হয়নি।");
    } finally {
      setWorking(false);
    }
  }

  async function arrive(transfer: Transfer) {
    setWorking(true);
    try {
      await api.post(`/parcels/${transfer.parcelId}/mark-arrived`, {});
      await loadData(user);
      notify(`${transfer.parcel.trackingNumber} received at this hub.`);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Parcel receive হয়নি।", true);
    } finally {
      setWorking(false);
    }
  }

  async function updateStatus(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setWorking(true);
    setError("");
    try {
      await api.patch(`/parcels/${selected.id}/status`, {
        status: nextStatus,
        ...(statusNote.trim() ? { note: statusNote.trim() } : {}),
      });
      setDialog(null);
      setSelected(null);
      await loadData(user);
      notify(`Parcel marked ${title(nextStatus).toLowerCase()}.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Status update হয়নি।");
    } finally {
      setWorking(false);
    }
  }

  async function startCheckout(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    setWorking(true);
    setError("");
    try {
      const checkout = isCustomer
        ? await api.post<{ checkoutUrl: string }>("/payments/stripe/customer-checkout", {
            trackingNumber: selected.trackingNumber,
            phone: checkoutPhone,
          })
        : await api.post<{ checkoutUrl: string }>("/payments/stripe/checkout", { parcelId: selected.id });
      window.location.assign(checkout.checkoutUrl);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Checkout শুরু করা যায়নি।");
      setWorking(false);
    }
  }

  async function updateProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;
    setProfileWorking(true);
    setError("");
    try {
      await api.patch("/auth/me", { name: profileName.trim(), phone: profilePhone.trim() || null });
      const refreshed = await api.me().catch(() => null);
      setUser(refreshed ?? { ...user, name: profileName.trim(), phone: profilePhone.trim() || null });
      notify("Your profile has been updated.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Profile update হয়নি। আবার চেষ্টা করুন।");
    } finally {
      setProfileWorking(false);
    }
  }

  function selectSection(item: Section) {
    setSection(item);
    setMobileMenu(false);
    setFilter("ALL");
  }

  if (loading)
    return (
      <main className="loading-screen">
        <span className="spinner" />
        <p>আপনার workspace তৈরি হচ্ছে…</p>
      </main>
    );
  if (!user) return null;

  const greeting = user.name?.split(" ")[0] || "there";
  const isCustomer = user.role === "CUSTOMER";
  const isMerchant = user.role === "MERCHANT";
  const isHub = user.role === "HUB_MANAGER";
  const isAdmin = user.role === "ADMIN";
  const isRider = user.role === "RIDER";
  const viewTransfers = isHub || user.role === "ADMIN";
  const roleMetric = isCustomer
    ? { label: "Paid online", value: paid, foot: "Parcels paid online", icon: "wallet" }
    : isMerchant
      ? {
          label: "COD value",
          value: parcels.reduce((sum, parcel) => sum + Number(parcel.codAmount || 0), 0),
          foot: "Across your parcels",
          icon: "wallet",
        }
      : isHub
        ? { label: "Inbound transfers", value: transfers.length, foot: "Addressed to your hub", icon: "truck" }
        : isRider
          ? {
              label: "Out for delivery",
              value: parcels.filter((parcel) => parcel.status === "OUT_FOR_DELIVERY").length,
              foot: "Assigned to your route",
              icon: "pin",
            }
          : {
              label: "In transit",
              value: parcels.filter((parcel) => parcel.status === "IN_TRANSIT").length,
              foot: "Moving between hubs",
              icon: "truck",
            };

  return (
    <main className="dashboard-bg">
      <div className="app-layout">
        {mobileMenu && (
          <button aria-label="Close navigation" className="sidebar-scrim" onClick={() => setMobileMenu(false)} />
        )}
        <aside className={`app-sidebar ${mobileMenu ? "open" : ""}`}>
          <div className="sidebar-brand">
            <Link className="brand" href="/">
              <span className="brand-symbol">
                <Icon name="arrow" size={17} />
              </span>
              pace
            </Link>
          </div>
          <div className="sidebar-label">Workspace</div>
          <nav className="side-nav">
            {navSections.map((item) => (
              <button
                key={item}
                className={`nav-item ${section === item ? "active" : ""}`}
                onClick={() => selectSection(item)}
              >
                <Icon
                  name={
                    {
                      overview: "spark",
                      parcels: "package",
                      inbound: "truck",
                      customers: "users",
                      riders: "user",
                      payments: "wallet",
                      operations: "spark",
                      profile: "user",
                    }[item]
                  }
                  size={16}
                />
                {sectionLabel(item, user.role)}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="support-card">
              <strong>Here to help</strong>
              <p>Something about a delivery doesn’t look right?</p>
              <a className="text-link" href="mailto:support@example.com">
                Talk to our team ↗
              </a>
            </div>
            <div className="sidebar-user">
              <div className="avatar avatar-lime">{initials(user.name)}</div>
              <div className="sidebar-user-meta">
                <strong>{user.name}</strong>
                <span>{roleLabel(user.role)}</span>
              </div>
              <button className="icon-button logout-button" type="button" aria-label="Sign out" onClick={signOut}>
                <Icon name="logout" size={15} />
              </button>
            </div>
          </div>
        </aside>

        <section className="app-main">
          <header className="topbar">
            <div className="topbar-leading">
              <button
                className="icon-button mobile-menu-button"
                aria-label="Open navigation"
                onClick={() => setMobileMenu(true)}
              >
                <Icon name="menu" size={17} />
              </button>
              <div className="breadcrumb">
                Your workspace <span>/</span> <strong>{sectionLabel(section, user.role)}</strong>
              </div>
            </div>
            <div className="topbar-actions">
              <Link className="icon-button top-help" aria-label="Help" href="mailto:support@example.com">
                <Icon name="bell" size={16} />
              </Link>
              <button className="topbar-user topbar-profile-button" type="button" onClick={() => selectSection("profile")}>
                <div className="avatar">{initials(user.name)}</div>
                <div className="topbar-user-copy">
                  <strong>{user.name}</strong>
                  <span>{roleLabel(user.role)}</span>
                </div>
              </button>
            </div>
          </header>

          <div className="app-content">
            <div className="welcome-row">
              <div>
                <div className="eyebrow">{date(new Date().toISOString())}</div>
                <h1>{section === "overview" ? `A good day to move things, ${greeting}.` : sectionLabel(section)}</h1>
                <p>
                  {isCustomer
                    ? "Your deliveries, with a little more peace of mind."
                    : isMerchant
                      ? "Your parcels and the people who are waiting for them."
                      : isHub
                        ? "Your hub, your parcels, your local delivery team."
                        : isRider
                          ? "Your assigned deliveries, ready when you are."
                          : "Here’s what is moving through your network today."}
                </p>
              </div>
              <div className="welcome-actions">
                {isMerchant && (
                  <button className="btn btn-light btn-small" type="button" onClick={() => openDialog("customer")}>
                    <Icon name="users" size={14} /> Add customer
                  </button>
                )}
                {isMerchant && (
                  <button
                    className="btn btn-small"
                    type="button"
                    onClick={() => {
                      if (customers.length === 0) openDialog("customer");
                      else openDialog("book");
                    }}
                  >
                    <Icon name="plus" size={15} /> New parcel
                  </button>
                )}
              </div>
            </div>

            {section !== "profile" && <section className="portal-banner">
              <div className="portal-copy">
                <span>
                  {isHub
                    ? "A good handoff makes all the difference"
                    : isCustomer
                      ? "A little more in the loop"
                      : isRider
                        ? "One safe delivery at a time"
                        : isMerchant
                          ? "From your store to their doorstep"
                          : "Every delivery tells a story"}
                </span>
                <h2>
                  {isCustomer
                    ? "Your deliveries, under one roof."
                    : isHub
                      ? "The right parcels, with your local team."
                      : isRider
                        ? "Your route is ready."
                        : isMerchant
                          ? "You’re in the driver’s seat."
                          : "Good things are on their way."}
                </h2>
                <p>
                  {isCustomer
                    ? "See the latest update on every order you’re expecting."
                    : isHub
                      ? "Receive transfers, keep parcels moving, and bring in a local rider."
                      : isRider
                        ? "Open a parcel to confirm delivery or report a failed attempt."
                        : isMerchant
                          ? "Book a parcel, share the updates and know when it lands."
                          : "A clear view of what’s moving today."}
                </p>
              </div>
              <span className="portal-icon">
                <Icon name={isCustomer ? "package" : isRider ? "pin" : "spark"} size={24} />
              </span>
            </section>}

            {section !== "profile" && <section className="metric-grid" aria-label="Parcel summary">
              {[
                { label: "All parcels", value: total, icon: "package", foot: "In your current view" },
                { label: "On the move", value: active, icon: "truck", foot: "Still making their way" },
                { label: "Delivered", value: delivered, icon: "check", foot: "Safely with their people" },
                roleMetric,
              ].map((metric) => (
                <article className="panel metric-card" key={metric.label}>
                  <div className="metric-top">
                    <span>{metric.label}</span>
                    <i className="metric-icon">
                      <Icon name={metric.icon} size={15} />
                    </i>
                  </div>
                  <strong className="metric-value">
                    {typeof metric.value === "number" && !Number.isInteger(metric.value)
                      ? money(metric.value)
                      : metric.value.toLocaleString("en-BD")}
                  </strong>
                  <span className="metric-foot">{metric.foot}</span>
                </article>
              ))}
            </section>}

            {error && (
              <div className="notice notice-error page-notice">
                <Icon name="close" size={15} />
                {error}
                <button type="button" className="text-link" onClick={() => loadData(user)}>
                  Retry
                </button>
              </div>
            )}

            {section === "profile" ? (
              <section className="panel profile-panel">
                <div className="profile-heading">
                  <div className="avatar avatar-lime">{initials(user.name)}</div>
                  <div>
                    <h2>Your profile</h2>
                    <p>Keep the contact details for your Pace account up to date.</p>
                  </div>
                </div>
                <form className="form-stack profile-form" onSubmit={updateProfile}>
                  <label className="form-label">
                    Full name
                    <input
                      className="form-input"
                      autoComplete="name"
                      required
                      minLength={2}
                      value={profileName}
                      onChange={(event) => setProfileName(event.target.value)}
                    />
                  </label>
                  <label className="form-label">
                    Email address <span className="form-help">Managed by your verified account</span>
                    <input className="form-input" type="email" value={user.email} readOnly />
                  </label>
                  <label className="form-label">
                    Phone number
                    <input
                      className="form-input"
                      autoComplete="tel"
                      inputMode="tel"
                      minLength={7}
                      maxLength={20}
                      value={profilePhone}
                      onChange={(event) => setProfilePhone(event.target.value)}
                      placeholder="Add a phone number"
                    />
                  </label>
                  <div className="profile-meta">
                    <span>Account type</span>
                    <strong>{roleLabel(user.role)}</strong>
                  </div>
                  <button className="btn" type="submit" disabled={profileWorking || profileName.trim().length < 2}>
                    {profileWorking ? "Saving profile…" : "Save profile"}
                    <Icon name="check" size={14} />
                  </button>
                </form>
              </section>
            ) : (
            <div className={"work-grid " + (section === "operations" ? "admin-ops-work-grid" : "")}>
              <section className="panel section-panel">
                <div className="section-head">
                  <div>
                    <h2>
                      {section === "customers"
                        ? "People you deliver to"
                        : section === "inbound"
                          ? "Coming to your hub"
                          : section === "riders"
                            ? "Your local delivery team"
                            : section === "payments"
                              ? "Payment activity"
                              : section === "parcels"
                                ? "All your parcels"
                                : "Recent parcel activity"}
                    </h2>
                    <p>
                      {section === "inbound"
                        ? `${transfers.length} transfer${transfers.length === 1 ? "" : "s"} headed to your hub`
                        : section === "customers"
                          ? `${customers.length} saved customer${customers.length === 1 ? "" : "s"}`
                          : `${visibleParcels.length} of ${total} parcel${total === 1 ? "" : "s"}`}
                    </p>
                  </div>
                  {section !== "customers" && section !== "riders" && section !== "inbound" && (
                    <div className="tabs">
                      <button className={filter === "ALL" ? "tab active" : "tab"} onClick={() => setFilter("ALL")}>
                        All
                      </button>
                      <button
                        className={filter === "IN_TRANSIT" ? "tab active" : "tab"}
                        onClick={() => setFilter("IN_TRANSIT")}
                      >
                        Moving
                      </button>
                      <button
                        className={filter === "DELIVERED" ? "tab active" : "tab"}
                        onClick={() => setFilter("DELIVERED")}
                      >
                        Delivered
                      </button>
                    </div>
                  )}
                </div>

                {(section === "overview" || section === "parcels" || section === "payments") && (
                  <>
                    <div className="table-tools">
                      <label className="table-search">
                        <Icon name="search" size={15} />
                        <input
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                          placeholder="Search by tracking number…"
                          aria-label="Search parcels"
                        />
                      </label>
                      {(isHub || isRider || user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
                        <label className="compact-select">
                          <span className="sr-only">Filter by status</span>
                          <select
                            value={
                              filter === "ALL" || filter === "IN_TRANSIT" || filter === "DELIVERED" ? "ALL" : filter
                            }
                            onChange={(e) => setFilter(e.target.value)}
                          >
                            <option value="ALL">All statuses</option>
                            {states.map((status) => (
                              <option value={status} key={status}>
                                {title(status)}
                              </option>
                            ))}
                          </select>
                        </label>
                      )}
                    </div>
                    <div className="parcel-list">
                      {visibleParcels.length ? (
                        visibleParcels.slice(0, section === "overview" ? 7 : 50).map((parcel) => (
                          <button
                            className="parcel-row"
                            type="button"
                            key={parcel.id}
                            onClick={() =>
                              openDialog(
                                isHub && ["AT_HUB", "SORTING", "DELIVERY_FAILED", "RESCHEDULED"].includes(parcel.status)
                                  ? "dispatch"
                                  : isRider && parcel.status === "OUT_FOR_DELIVERY"
                                    ? "status"
                                    : "cancel",
                                parcel,
                              )
                            }
                          >
                            <span className="parcel-primary">
                              <strong>{parcel.trackingNumber}</strong>
                              <span>
                                {isCustomer
                                  ? parcel.deliveryAddress || "Your delivery"
                                  : parcel.customer?.name || "Recipient"}
                              </span>
                            </span>
                            <span className="parcel-destination">
                              <Icon name="pin" size={13} />
                              {isCustomer ? "Delivery address" : parcel.deliveryAddress || "Address pending"}
                            </span>
                            <Status value={parcel.status} />
                            <span className="row-open">
                              <Icon name="arrow" size={13} />
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="empty-state">
                          <span className="empty-mark">
                            <Icon name={isCustomer ? "box" : "search"} size={18} />
                          </span>
                          <h3>
                            {error
                              ? "Your parcels could not be loaded"
                              : search
                                ? "No parcel matches that search"
                                : isCustomer
                                  ? "Your next delivery will show up here"
                                  : "A little breathing room."}
                          </h3>
                          <p>
                            {error
                              ? "Check that the API is running and the account has access to this workspace."
                              : search
                                ? "Try another tracking number or clear the search."
                                : isCustomer
                                  ? "Ask the sender to use the same verified email as your Pace account on the recipient details."
                                  : "There aren’t any parcels here right now. New work will appear when it’s booked."}
                          </p>
                          {isMerchant && !search && (
                            <button className="btn btn-small" type="button" onClick={() => openDialog("book")}>
                              <Icon name="plus" size={14} /> Book a parcel
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {section === "customers" && (
                  <div className="directory-list">
                    {customers.length ? (
                      customers.map((customer) => (
                        <div className="directory-row" key={customer.id}>
                          <span className="avatar">{initials(customer.name)}</span>
                          <span className="directory-name">
                            <strong>{customer.name}</strong>
                            <small>{customer.email || customer.phone}</small>
                          </span>
                          <span className="directory-note">
                            {customer.email
                              ? "Portal connected by email"
                              : "Add an email so they can see their parcels"}
                          </span>
                          <button
                            className="icon-button directory-action"
                            aria-label={`Book a parcel for ${customer.name}`}
                            onClick={() => {
                              setBookingCustomerId(customer.id);
                              openDialog("book");
                            }}
                          >
                            <Icon name="plus" size={15} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <span className="empty-mark">
                          <Icon name="users" />
                        </span>
                        <h3>No customers saved yet</h3>
                        <p>
                          Add someone to address a parcel to them. Their verified email can connect their own customer
                          account.
                        </p>
                        <button className="btn btn-small" onClick={() => openDialog("customer")}>
                          <Icon name="plus" size={13} /> Add customer
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {section === "inbound" && (
                  <div className="directory-list">
                    {transfers.length ? (
                      transfers.map((transfer) => (
                        <div className="inbound-row" key={transfer.id}>
                          <span className="inbound-icon">
                            <Icon name="truck" size={18} />
                          </span>
                          <span className="directory-name">
                            <strong>{transfer.parcel.trackingNumber}</strong>
                            <small>
                              {transfer.fromHub?.name || "Origin hub"} → {transfer.toHub.name} · Sent{" "}
                              {date(transfer.transferredAt)}
                            </small>
                          </span>
                          <button
                            className="btn btn-small btn-receive"
                            type="button"
                            disabled={working}
                            onClick={() => arrive(transfer)}
                          >
                            Receive parcel <Icon name="arrowRight" size={13} />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <span className="empty-mark">
                          <Icon name="truck" />
                        </span>
                        <h3>No incoming transfers</h3>
                        <p>
                          Parcels sent to your hub will appear here. Transfers to another hub won’t show up in your
                          list.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {section === "riders" && (
                  <div className="directory-list">
                    {riders.length ? (
                      riders.map((rider) => (
                        <div className="directory-row" key={rider.id}>
                          <span className="avatar">
                            <Icon name="user" size={15} />
                          </span>
                          <span className="directory-name">
                            <strong>{rider.user.name}</strong>
                            <small>{rider.vehicleType || "Local delivery"}</small>
                          </span>
                          <span className="status-badge tone-green">
                            <i className="status-dot" />
                            Available
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="empty-state">
                        <span className="empty-mark">
                          <Icon name="user" />
                        </span>
                        <h3>Riders show up as they’re ready</h3>
                        <p>Only active riders assigned to your hub are available for parcel handoff.</p>
                      </div>
                    )}
                  </div>
                )}
              </section>
              {section === "operations" && (isAdmin || user.role === "SUPER_ADMIN") && (
                <AdminOperations
                  canManageNetwork={isAdmin}
                  allowAdminCreation={user.role === "SUPER_ADMIN"}
                />
              )}

              <aside className={"side-stack " + (section === "operations" ? "admin-ops-aside" : "")}>
                {isCustomer && (
                  <section className="panel quick-card">
                    <h3>Expecting a parcel?</h3>
                    <p>Track it using the number the sender shared with you.</p>
                    <Link className="quick-link" href="/#track">
                      Track by number <Icon name="arrowRight" size={14} />
                    </Link>
                  </section>
                )}
                {isMerchant && (
                  <section className="panel quick-card">
                    <h3>Ready for a new order?</h3>
                    <p>Add the recipient’s email so they can follow the delivery from their own account.</p>
                    <button className="quick-link" onClick={() => openDialog("book")}>
                      Book a parcel <Icon name="arrowRight" size={14} />
                    </button>
                    <button className="quick-link" onClick={() => openDialog("customer")}>
                      Add a customer <Icon name="arrowRight" size={14} />
                    </button>
                  </section>
                )}
                {isHub && (
                  <section className="panel quick-card">
                    <h3>Your assigned hub</h3>
                    <p>Parcel and rider access are limited to one active hub.</p>
                    {hubs.length ? (
                      hubs.map((hub) => (
                        <div className="hub-chip" key={hub.id}>
                          <span className="live-dot" />
                          {hub.name}
                          <small>{hub.code}</small>
                        </div>
                      ))
                    ) : (
                      <p>An administrator needs to map your account to a hub.</p>
                    )}
                    <button
                      className="quick-link"
                      onClick={() => {
                        setSection("inbound");
                        api
                          .get<Rider[]>("/operations/riders")
                          .then(setRiders)
                          .catch((err) =>
                            notify(err instanceof ApiError ? err.message : "Rider list unavailable.", true),
                          );
                      }}
                    >
                      View incoming parcels <Icon name="arrowRight" size={14} />
                    </button>
                  </section>
                )}
                {isRider && (
                  <section className="panel quick-card">
                    <h3>On your route</h3>
                    <p>Your parcel list includes only active assignments for your rider account.</p>
                    <div className="rider-metric">
                      <span>Assigned to you</span>
                      <strong>{active}</strong>
                    </div>
                  </section>
                )}
                {viewTransfers && (
                  <section className="panel quick-card">
                    <h3>Transfer overview</h3>
                    <p>
                      {isHub
                        ? "Destination hub details are used for parcel routing; they don’t grant you access to another hub’s parcels."
                        : "Keep an eye on every network transfer."}
                    </p>
                    <button className="quick-link" onClick={() => selectSection("inbound")}>
                      View inbound transfers <Icon name="arrowRight" size={14} />
                    </button>
                  </section>
                )}
                <section className="panel quick-card security-card">
                  <span className="feature-icon">
                    <Icon name="check" size={16} />
                  </span>
                  <h3>Your deliveries stay yours</h3>
                  <p>Every workspace shows parcels and actions according to the account that signed in.</p>
                  <Link className="quick-link" href="/">
                    Browse Pace <Icon name="arrowRight" size={14} />
                  </Link>
                </section>
              </aside>
            </div>
            )}
          </div>
        </section>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        {navSections.slice(0, 4).map((item) => (
          <button key={item} className={section === item ? "active" : ""} onClick={() => selectSection(item)}>
            <Icon
              name={
                {
                  overview: "spark",
                  parcels: "package",
                  inbound: "truck",
                  customers: "users",
                  riders: "user",
                  payments: "wallet",
                  operations: "spark",
                  profile: "user",
                }[item]
              }
              size={16}
            />
            {sectionLabel(item, user.role)}
          </button>
        ))}
      </nav>

      {dialog && (
        <div
          className="modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setDialog(null);
          }}
        >
          <section className="modal" role="dialog" aria-modal="true">
            <header className="modal-head">
              <div>
                <h2>
                  {dialog === "book"
                    ? "Book a new parcel"
                    : dialog === "customer"
                      ? "Add a customer"
                      : dialog === "cancel"
                        ? isCustomer
                          ? "Cancel this parcel?"
                          : "Parcel details"
                        : dialog === "origin"
                          ? "Assign origin hub"
                          : dialog === "dispatch"
                            ? "Send to a destination hub"
                            : dialog === "assign"
                              ? "Choose a local rider"
                              : dialog === "checkout"
                                ? "Pay online"
                                : "Update delivery status"}
                </h2>
                <p>
                  {dialog === "book"
                    ? "We’ll keep this parcel connected to your recipient."
                    : selected
                      ? `${selected.trackingNumber}${selected.status ? ` · ${title(selected.status)}` : ""}`
                      : "Your details are checked before the action is saved."}
                </p>
              </div>
              <button
                className="icon-button"
                aria-label="Close"
                type="button"
                onClick={() => {
                  setDialog(null);
                  setError("");
                }}
              >
                <Icon name="close" size={16} />
              </button>
            </header>

            {error && <div className="notice notice-error modal-error">{error}</div>}
            {dialog === "customer" && (
              <form className="form-stack" onSubmit={submitCustomer}>
                <label className="form-label">
                  Customer name
                  <input
                    className="form-input"
                    required
                    minLength={2}
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Name of recipient"
                  />
                </label>
                <label className="form-label">
                  Phone number
                  <input
                    className="form-input"
                    required
                    minLength={7}
                    maxLength={20}
                    inputMode="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                  />
                </label>
                <label className="form-label">
                  Email address <span className="form-help">Add the email they use for their Pace account.</span>
                  <input
                    className="form-input"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Optional, but connects their account"
                  />
                </label>
                <button className="btn" type="submit" disabled={working}>
                  {working ? "Saving…" : "Save customer"}
                  <Icon name="arrowRight" size={14} />
                </button>
              </form>
            )}

            {dialog === "book" && (
              <form className="form-stack" onSubmit={submitBooking}>
                {!customers.length ? (
                  <div className="notice">
                    No saved customers yet. Add the recipient first and include their account email if they want
                    self-service access.
                  </div>
                ) : null}
                <label className="form-label">
                  Recipient
                  <select
                    className="form-input"
                    required
                    value={bookingCustomerId}
                    onChange={(e) => setBookingCustomerId(e.target.value)}
                  >
                    <option value="">Choose a customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} · {customer.phone}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-label">
                  Pickup address
                  <input
                    className="form-input"
                    required
                    minLength={5}
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    placeholder="Street, area, city"
                  />
                </label>
                <label className="form-label">
                  Delivery address
                  <input
                    className="form-input"
                    required
                    minLength={5}
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Street, area, city"
                  />
                </label>
                <div className="form-two">
                  <label className="form-label">
                    Weight (grams)
                    <input
                      className="form-input"
                      type="number"
                      min="1"
                      step="1"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      required
                    />
                  </label>
                  <label className="form-label">
                    Cash on delivery (৳)
                    <input
                      className="form-input"
                      type="number"
                      min="0"
                      step="0.01"
                      value={cod}
                      onChange={(e) => setCod(e.target.value)}
                      required
                    />
                  </label>
                </div>
                {hubs.length > 0 && (
                  <label className="form-label">
                    Origin hub{" "}
                    <span className="form-help">Optional — book first if your parcel isn’t at a hub yet.</span>
                    <select className="form-input" value={originHub} onChange={(e) => setOriginHub(e.target.value)}>
                      <option value="">Assign later</option>
                      {hubs.map((hub) => (
                        <option value={hub.id} key={hub.id}>
                          {hub.name}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <button className="btn" type="submit" disabled={working || !bookingCustomerId}>
                  {working ? "Booking…" : "Create parcel"}
                  <Icon name="arrowRight" size={14} />
                </button>
              </form>
            )}

            {dialog === "cancel" && selected && (
              <>
                <div className="detail-grid">
                  <div className="detail-cell">
                    <span>Tracking number</span>
                    <strong>{selected.trackingNumber}</strong>
                  </div>
                  <div className="detail-cell">
                    <span>Current status</span>
                    <strong>{title(selected.status)}</strong>
                  </div>
                </div>
                {isCustomer && ["CREATED", "PICKUP_ASSIGNED"].includes(selected.status) ? (
                  <form className="form-stack" onSubmit={cancelParcel}>
                    <label className="form-label">
                      Why would you like to cancel?
                      <textarea
                        className="form-input form-textarea"
                        minLength={3}
                        maxLength={300}
                        required
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="A short note for the sender"
                      />
                    </label>
                    <p className="form-help">
                      Your parcel hasn’t been picked up yet. We’ll stop the delivery and let the sender know.
                    </p>
                    <button className="btn btn-danger" type="submit" disabled={working}>
                      {working ? "Cancelling…" : "Cancel parcel"}
                    </button>
                  </form>
                ) : (
                  <>
                    <p className="form-help">
                      {isCustomer
                        ? "Only the recipient can cancel, and only before pickup. This parcel has already moved past that point."
                        : "Parcel information"}
                    </p>
                    {selected.status === "OUT_FOR_DELIVERY" && Number(selected.codAmount) > 0 && (
                      <button className="btn" type="button" onClick={() => setDialog("checkout")}>
                        {isCustomer ? "Pay COD online" : "Create secure checkout"} <Icon name="arrowRight" size={14} />
                      </button>
                    )}
                    {selected.trackingEvents?.length ? (
                      <div className="timeline">
                        {selected.trackingEvents.map((item, i) => (
                          <div className="timeline-item" key={`${item.status}-${item.createdAt}`}>
                            <i className={`timeline-dot ${i === selected.trackingEvents!.length - 1 ? "" : "muted"}`} />
                            <div>
                              <strong>{title(item.status)}</strong>
                              <span>
                                {item.note || item.location || "Parcel update"} · {date(item.createdAt)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="detail-actions">
                      {isAdmin && ["CREATED", "PICKED_UP"].includes(selected.status) && !selected.currentHubId && (
                        <button
                          className="btn btn-light btn-small"
                          type="button"
                          onClick={() => {
                            setOriginHub("");
                            setDialog("origin");
                          }}
                        >
                          Assign origin hub
                        </button>
                      )}
                      {(isHub || isAdmin) && ["AT_HUB", "SORTING"].includes(selected.status) && (
                        <button
                          className="btn btn-light btn-small"
                          type="button"
                          onClick={() => openDialog("dispatch", selected)}
                        >
                          Dispatch to a hub
                        </button>
                      )}
                      {(isHub || isAdmin) &&
                        ["AT_HUB", "SORTING", "DELIVERY_FAILED", "RESCHEDULED"].includes(selected.status) && (
                          <button
                            className="btn btn-small"
                            type="button"
                            onClick={() => {
                              void loadRiders(selected.currentHubId);
                              setDialog("assign");
                            }}
                          >
                            Assign local rider
                          </button>
                        )}
                      {isHub && ["AT_HUB", "SORTING"].includes(selected.status) && (
                        <button
                          className="btn btn-light btn-small"
                          onClick={() => {
                            loadRiders(selected.currentHubId);
                            openDialog("dispatch", selected);
                          }}
                        >
                          Dispatch to a hub
                        </button>
                      )}
                      {isHub && ["AT_HUB", "SORTING", "DELIVERY_FAILED", "RESCHEDULED"].includes(selected.status) && (
                        <button
                          className="btn btn-small"
                          onClick={() => {
                            loadRiders(selected.currentHubId);
                            setDialog("assign");
                          }}
                        >
                          Assign local rider
                        </button>
                      )}
                      {isRider && selected.status === "OUT_FOR_DELIVERY" && (
                        <button className="btn btn-small" onClick={() => setDialog("status")}>
                          Update delivery
                        </button>
                      )}
                      {selected.status === "OUT_FOR_DELIVERY" && isCustomer && Number(selected.codAmount) > 0 && (
                        <button className="btn btn-small" onClick={() => setDialog("checkout")}>
                          Pay securely
                        </button>
                      )}
                    </div>
                  </>
                )}
              </>
            )}

            {dialog === "origin" && selected && (
              <form className="form-stack" onSubmit={assignOriginHub}>
                <label className="form-label">
                  Origin hub
                  <select
                    className="form-input"
                    required
                    value={originHub}
                    onChange={(e) => setOriginHub(e.target.value)}
                  >
                    <option value="">Choose an active hub</option>
                    {hubs.map((hub) => (
                      <option value={hub.id} key={hub.id}>
                        {hub.name} · {hub.code}
                      </option>
                    ))}
                  </select>
                </label>
                {!hubs.length && <div className="notice notice-error">No active hubs are available.</div>}
                <p className="form-help">Assigning the origin hub moves this parcel to AT HUB for local processing.</p>
                <button className="btn" type="submit" disabled={working || !originHub || !hubs.length}>
                  {working ? "Assigning…" : "Assign hub"}
                  <Icon name="arrowRight" size={14} />
                </button>
              </form>
            )}
            {dialog === "dispatch" && (
              <form className="form-stack" onSubmit={dispatchParcel}>
                <label className="form-label">
                  Destination hub
                  <select
                    className="form-input"
                    required
                    value={destinationHub}
                    onChange={(e) => setDestinationHub(e.target.value)}
                  >
                    <option value="">Choose a destination</option>
                    {transfersDestinationOptions(destinationHubs, selected?.currentHubId).map((hub) => (
                      <option value={hub.id} key={hub.id}>
                        {hub.name} · {hub.code}
                      </option>
                    ))}
                  </select>
                </label>
                <button className="btn" disabled={working || !destinationHub}>
                  {working ? "Dispatching…" : "Confirm dispatch"}
                  <Icon name="arrowRight" size={14} />
                </button>
                <p className="form-help">
                  The current hub keeps access until the destination manager receives the parcel.
                </p>
              </form>
            )}

            {dialog === "assign" && (
              <form className="form-stack" onSubmit={assignRider}>
                <label className="form-label">
                  Active and available rider
                  <select className="form-input" required value={riderId} onChange={(e) => setRiderId(e.target.value)}>
                    <option value="">Choose a local rider</option>
                    {riders.map((rider) => (
                      <option value={rider.id} key={rider.id}>
                        {rider.user.name}
                        {rider.vehicleType ? ` · ${rider.vehicleType}` : ""}
                      </option>
                    ))}
                  </select>
                </label>
                {!riders.length && (
                  <span className="form-help">There are no available riders assigned to this hub right now.</span>
                )}
                <button className="btn" disabled={working || !riderId}>
                  {working ? "Assigning…" : "Assign rider"}
                  <Icon name="arrowRight" size={14} />
                </button>
              </form>
            )}

            {dialog === "status" && (
              <form className="form-stack" onSubmit={updateStatus}>
                <label className="form-label">
                  Delivery result
                  <select className="form-input" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
                    <option value="DELIVERED">Delivered</option>
                    <option value="DELIVERY_FAILED">Delivery attempt failed</option>
                  </select>
                </label>
                {nextStatus === "DELIVERY_FAILED" && (
                  <label className="form-label">
                    What happened?
                    <textarea
                      className="form-input form-textarea"
                      maxLength={300}
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Recipient unavailable, address unclear…"
                    />
                  </label>
                )}
                <button className="btn" disabled={working}>
                  {working ? "Updating…" : "Save delivery update"}
                  <Icon name="check" size={14} />
                </button>
              </form>
            )}

            {dialog === "checkout" && selected && (
              <form className="form-stack" onSubmit={startCheckout}>
                <div className="payment-summary">
                  <span>Cash on delivery</span>
                  <strong>{money(selected.codAmount)}</strong>
                </div>
                {isCustomer && (
                  <label className="form-label">
                    Recipient phone
                    <input
                      className="form-input"
                      required
                      minLength={7}
                      maxLength={20}
                      inputMode="tel"
                      value={checkoutPhone}
                      onChange={(e) => setCheckoutPhone(e.target.value)}
                      placeholder="The phone saved by the sender"
                    />
                  </label>
                )}
                <p className="form-help">
                  Stripe opens a secure checkout. Delivery completes after Stripe confirms payment.
                </p>
                <button className="btn" disabled={working}>
                  {working ? "Opening secure checkout…" : "Continue to secure payment"}
                  <Icon name="arrowRight" size={14} />
                </button>
              </form>
            )}
          </section>
        </div>
      )}
      {toast && (
        <div className={`toast ${toast.error ? "error" : ""}`} role="status">
          <Icon name={toast.error ? "close" : "check"} size={15} />
          {toast.text}
        </div>
      )}
    </main>
  );

  async function loadRiders(hubId?: string | null) {
    setRiders([]);
    setRiderId("");
    if (!hubId) {
      notify("This parcel is not at a hub yet.", true);
      return;
    }
    try {
      const result = await api.get<Rider[]>(`/operations/riders?hubId=${encodeURIComponent(hubId)}`);
      setRiders(result);
    } catch (err) {
      notify(err instanceof ApiError ? err.message : "Local riders could not be loaded.", true);
    }
  }
}

function transfersDestinationOptions(hubs: Hub[], currentHubId?: string | null) {
  return hubs.filter((hub) => hub.id !== currentHubId);
}

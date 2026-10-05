import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "API documentation | Pace",
  description: "Endpoint reference and integration guide for the Pace Courier Logistics API.",
};

type Method = "GET" | "POST" | "PATCH";
type Endpoint = {
  method: Method;
  path: string;
  access: string;
  summary: string;
  request?: string;
  note?: string;
};
type Section = {
  id: string;
  title: string;
  summary: string;
  endpoints: Endpoint[];
};

const sections: Section[] = [
  {
    id: "auth",
    title: "Authentication",
    summary: "Account access, sessions, verification and profile management.",
    endpoints: [
      { method: "POST", path: "/auth/register", access: "Public", summary: "Start customer or merchant registration.", request: '{ "email": "user@example.com", "password": "…", "name": "Name", "phone": "…", "merchantName": "Optional store" }', note: "An email verification step is required before the account is created. Omit merchantName to register a customer." },
      { method: "POST", path: "/auth/verify-email", access: "Public", summary: "Verify an email address using its code or token.", request: '{ "email": "user@example.com", "code": "123456" }', note: "Alternatively send { token } from a verification link." },
      { method: "GET", path: "/auth/verify-email?token={token}", access: "Public", summary: "Verify an email address from a link." },
      { method: "POST", path: "/auth/resend-verification", access: "Public", summary: "Resend a pending email verification.", request: '{ "email": "user@example.com" }' },
      { method: "POST", path: "/auth/login", access: "Public", summary: "Log in with an email and password.", request: '{ "email": "user@example.com", "password": "…" }', note: "Returns an accessToken and sets an HttpOnly refresh cookie." },
      { method: "POST", path: "/auth/google", access: "Public", summary: "Sign in with a Google ID credential.", request: '{ "credential": "<Google ID credential>" }', note: "The backend validates the credential against its configured Google OAuth client." },
      { method: "POST", path: "/auth/refresh", access: "Refresh cookie", summary: "Rotate the refresh session and issue a new access token.", request: "{}" },
      { method: "POST", path: "/auth/logout", access: "Signed in", summary: "Revoke the current refresh session and clear its cookie.", request: "{}" },
      { method: "GET", path: "/auth/me", access: "Signed in", summary: "Get the current user's profile." },
      { method: "PATCH", path: "/auth/me", access: "Signed in", summary: "Update the current user's name or phone.", request: '{ "name": "Updated name", "phone": "01700000000" }', note: "Send at least one field. phone may be null." },
      { method: "POST", path: "/auth/admins", access: "SUPER_ADMIN", summary: "Create an administrator.", request: '{ "email": "admin@example.com", "password": "…", "name": "Admin" }' },
      { method: "POST", path: "/auth/forgot-password", access: "Public", summary: "Request a password reset email.", request: '{ "email": "user@example.com" }' },
      { method: "POST", path: "/auth/reset-password", access: "Public", summary: "Set a new password using a code or token.", request: '{ "email": "user@example.com", "code": "123456", "password": "…" }' },
      { method: "GET", path: "/auth/reset-password?token={token}", access: "Public", summary: "Validate a password-reset link." },
    ],
  },
  {
    id: "customers",
    title: "Customers",
    summary: "Recipient directory and customer self-service parcel actions.",
    endpoints: [
      { method: "GET", path: "/customers?page=1&limit=20", access: "MERCHANT, ADMIN", summary: "List customers in the current merchant context.", note: "Admins may filter by merchantId." },
      { method: "POST", path: "/customers", access: "MERCHANT, ADMIN", summary: "Create a parcel recipient.", request: '{ "name": "Recipient", "phone": "01700000000", "email": "optional@example.com" }', note: "Admins also provide merchantId." },
      { method: "GET", path: "/customers/me/parcels?page=1&limit=20", access: "CUSTOMER", summary: "List parcels addressed to the signed-in customer." },
      { method: "POST", path: "/customers/me/parcels/{id}/cancel", access: "CUSTOMER", summary: "Cancel an eligible parcel before pickup.", request: '{ "reason": "Plans changed" }', note: "Available only while status is CREATED or PICKUP_ASSIGNED." },
    ],
  },
  {
    id: "parcels",
    title: "Parcels",
    summary: "Booking, tracking, hub routing and delivery status.",
    endpoints: [
      { method: "GET", path: "/parcels/track/{trackingNumber}", access: "Public", summary: "Read a parcel's public status and tracking events." },
      { method: "GET", path: "/parcels?page=1&limit=20&status=AT_HUB", access: "Signed in", summary: "List parcels visible to the current role.", note: "Pagination and status filters are optional; results are role-scoped." },
      { method: "POST", path: "/parcels", access: "MERCHANT, ADMIN", summary: "Book a parcel.", request: '{ "customerId": "<id>", "pickupAddress": "…", "deliveryAddress": "…", "weightGrams": 1500, "codAmount": 1250, "description": "Documents" }', note: "Send an Idempotency-Key header. Admins also provide merchantId; merchants are bound to their own account." },
      { method: "POST", path: "/parcels/{id}/assign-origin-hub", access: "MERCHANT, ADMIN", summary: "Assign the parcel to its origin hub.", request: '{ "hubId": "<hub-id>" }' },
      { method: "POST", path: "/parcels/{id}/dispatch", access: "HUB_MANAGER, ADMIN", summary: "Dispatch a parcel to a destination hub.", request: '{ "destinationHubId": "<hub-id>", "vehicleId": "optional-id" }' },
      { method: "POST", path: "/parcels/{id}/mark-arrived", access: "HUB_MANAGER, ADMIN", summary: "Mark an inbound transfer as received.", request: "{}" },
      { method: "POST", path: "/parcels/{id}/assign-rider", access: "HUB_MANAGER, ADMIN", summary: "Assign an available rider at the current hub.", request: '{ "riderId": "<rider-id>" }' },
      { method: "PATCH", path: "/parcels/{id}/status", access: "ADMIN, MERCHANT, HUB_MANAGER, assigned RIDER", summary: "Apply a permitted parcel status transition.", request: '{ "status": "DELIVERED", "note": "Optional note" }', note: "Use the dedicated hub and rider endpoints for dispatch, arrival, origin-hub assignment and rider assignment." },
    ],
  },
  {
    id: "operations",
    title: "Operations",
    summary: "Branches, hubs, vehicles, riders and hub-manager assignments.",
    endpoints: [
      { method: "GET", path: "/operations/branches", access: "ADMIN", summary: "List active branches." },
      { method: "POST", path: "/operations/branches", access: "ADMIN", summary: "Create a branch.", request: '{ "name": "Dhaka Operations", "code": "DHK-BR-01", "type": "HUB" }' },
      { method: "GET", path: "/operations/hubs", access: "ADMIN, MERCHANT, HUB_MANAGER", summary: "List active hubs visible to the current role." },
      { method: "POST", path: "/operations/hubs", access: "ADMIN", summary: "Create a hub.", request: '{ "name": "Dhaka Central", "code": "DHK-01", "address": "Motijheel", "city": "Dhaka" }' },
      { method: "GET", path: "/operations/transfer-destinations", access: "ADMIN, HUB_MANAGER", summary: "List active destination hubs with limited public directory fields." },
      { method: "GET", path: "/operations/vehicles", access: "ADMIN, HUB_MANAGER", summary: "List active vehicles." },
      { method: "POST", path: "/operations/vehicles", access: "ADMIN", summary: "Create a vehicle.", request: '{ "type": "Van", "plateNumber": "DHAKA-METRO-GA-00-00", "capacityKg": 500 }' },
      { method: "GET", path: "/operations/riders?hubId={id}", access: "ADMIN, HUB_MANAGER", summary: "List available riders visible to the current role." },
      { method: "POST", path: "/operations/riders", access: "ADMIN", summary: "Create a rider account.", request: '{ "email": "rider@example.com", "password": "…", "name": "Rider", "hubId": "<hub-id>" }' },
      { method: "GET", path: "/operations/inbound-transfers", access: "ADMIN, HUB_MANAGER", summary: "List inbound transfers for the current hub scope." },
      { method: "GET", path: "/operations/hub-managers", access: "ADMIN", summary: "List hub managers." },
      { method: "POST", path: "/operations/hub-managers", access: "ADMIN", summary: "Create a hub manager.", request: '{ "email": "manager@example.com", "password": "…", "name": "Manager", "hubId": "<hub-id>" }' },
      { method: "PATCH", path: "/operations/hub-managers/{id}/hub", access: "ADMIN", summary: "Assign an existing hub manager to a hub.", request: '{ "hubId": "<hub-id>" }' },
    ],
  },
  {
    id: "payments",
    title: "Payments",
    summary: "Stripe checkout, payment status and the server-to-server webhook.",
    endpoints: [
      { method: "POST", path: "/payments/stripe/customer-checkout", access: "Public", summary: "Start COD payment after matching the parcel tracking number and phone.", request: '{ "trackingNumber": "CLP0AB12CD", "phone": "01700000000" }', note: "The parcel must be OUT_FOR_DELIVERY." },
      { method: "POST", path: "/payments/stripe/checkout", access: "MERCHANT, ADMIN", summary: "Create an authenticated parcel checkout.", request: '{ "parcelId": "<parcel-id>" }' },
      { method: "GET", path: "/payments/stripe/checkout/{sessionId}/status", access: "Public", summary: "Read and refresh the Stripe checkout status." },
      { method: "POST", path: "/payments/stripe/webhook", access: "Stripe", summary: "Receive signed payment events from Stripe.", note: "Server-to-server endpoint. Do not call from the browser or mark payments successful in frontend code." },
    ],
  },
  {
    id: "system",
    title: "System",
    summary: "Health and readiness probes.",
    endpoints: [
      { method: "GET", path: "/health", access: "Public", summary: "Check that the API process is alive." },
      { method: "GET", path: "/ready", access: "Public", summary: "Check database readiness; returns 503 if the database query fails." },
    ],
  },
];

const endpointCount = sections.reduce((total, section) => total + section.endpoints.length, 0);
const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "https://courier-logistics-platform-api.vercel.app/api/v1";

export default function ApiDocsPage() {
  return (
    <main className="api-docs-page">
      <header className="api-docs-header">
        <Link className="docs-brand" href="/">
          <span className="docs-brand-mark" aria-hidden="true">↗</span>
          pace <span>API</span>
        </Link>
        <nav aria-label="Documentation links">
          <Link href="/">Home</Link>
          <Link className="docs-sign-in" href="/sign-in">Sign in <span aria-hidden="true">↗</span></Link>
        </nav>
      </header>

      <section className="api-docs-hero">
        <div className="docs-eyebrow"><span /> REST API · VERSION 1</div>
        <h1>Build with the<br /><em>Pace delivery API.</em></h1>
        <p>Everything you need to connect accounts, parcels, operations and payments to the courier network.</p>
        <div className="docs-hero-meta">
          <span><strong>{endpointCount}</strong> endpoints</span>
          <span>JSON responses</span>
          <span>Role-based access</span>
        </div>
      </section>

      <div className="api-docs-layout">
        <aside className="docs-sidebar">
          <span className="docs-sidebar-label">GUIDE</span>
          <a href="#overview">Overview</a>
          <a href="#authentication">Authentication</a>
          <span className="docs-sidebar-label docs-sidebar-spaced">ENDPOINTS</span>
          {sections.map((section) => <a key={section.id} href={`#${section.id}`}>{section.title}</a>)}
        </aside>

        <div className="docs-main">
          <section className="docs-panel" id="overview">
            <div className="docs-section-heading"><span>01</span><div><h2>Overview</h2><p>One base URL for every API request.</p></div></div>
            <div className="docs-base-url"><span>BASE URL</span><code>{apiBase}</code></div>
            <div className="docs-note"><strong>Content type</strong><span>Send JSON with <code>Content-Type: application/json</code>. Endpoint paths below are relative to the base URL.</span></div>
          </section>

          <section className="docs-panel" id="authentication">
            <div className="docs-section-heading"><span>02</span><div><h2>Authentication & responses</h2><p>Use a bearer token for protected routes.</p></div></div>
            <div className="docs-two-column">
              <div className="docs-note"><strong>Access token</strong><span>Send <code>Authorization: Bearer &lt;accessToken&gt;</code>. After a 401, refresh once with <code>POST /auth/refresh</code>; the refresh token is an HttpOnly cookie.</span></div>
              <div className="docs-note"><strong>Response envelope</strong><span>Success responses use <code>success</code>, <code>message</code> and <code>data</code>. Errors include a message and request errors.</span></div>
            </div>
            <pre className="docs-code"><code>{`{\n  "success": true,\n  "message": "Request completed",\n  "data": {}\n}`}</code></pre>
            <p className="docs-small-print">Admins include SUPER_ADMIN where ADMIN access is listed. Hub managers and merchants are limited to their assigned hub or merchant account.</p>
          </section>

          {sections.map((section, index) => (
            <section className="docs-panel docs-endpoint-section" id={section.id} key={section.id}>
              <div className="docs-section-heading"><span>{String(index + 3).padStart(2, "0")}</span><div><h2>{section.title}</h2><p>{section.summary}</p></div><small>{section.endpoints.length} routes</small></div>
              <div className="docs-endpoint-list">
                {section.endpoints.map((endpoint) => (
                  <details className="docs-endpoint" key={`${endpoint.method}-${endpoint.path}`}>
                    <summary>
                      <span className={`docs-method docs-method-${endpoint.method.toLowerCase()}`}>{endpoint.method}</span>
                      <code className="docs-path">{endpoint.path}</code>
                      <span className="docs-access">{endpoint.access}</span>
                      <span className="docs-expand" aria-hidden="true">+</span>
                    </summary>
                    <div className="docs-endpoint-body">
                      <p>{endpoint.summary}</p>
                      {endpoint.request && <div className="docs-request"><strong>Request body</strong><pre className="docs-code"><code>{endpoint.request}</code></pre></div>}
                      {endpoint.note && <div className="docs-endpoint-note">{endpoint.note}</div>}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          ))}

          <section className="docs-footer-callout">
            <div><span className="docs-eyebrow">NEED A STARTING POINT?</span><h2>Follow a parcel from booking to delivery.</h2><p>Set up hubs and a recipient, book a parcel, then dispatch it through the delivery network.</p></div>
            <Link href="/register">Create an account <span aria-hidden="true">↗</span></Link>
          </section>
          <footer className="docs-page-footer"><Link href="/">Pace Logistics</Link><span>API reference · v1</span><a href="#overview">Back to top ↑</a></footer>
        </div>
      </div>
    </main>
  );
}

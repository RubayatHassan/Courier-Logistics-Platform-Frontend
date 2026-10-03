# Courier-Logistics-Platform-Frontend

A responsive Next.js App Router frontend for the Courier & Logistics Platform API. The interface supports public parcel tracking, customer and merchant registration, role-based workspaces, merchant parcel booking, hub transfers and local rider assignment, delivery updates, and Stripe COD checkout.

## Run locally

Requirements: Node.js 20.9 or newer and pnpm.

```powershell
Copy-Item .env.example .env.local
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The default API URL is `http://localhost:4000/api/v1`; set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` if the backend runs elsewhere. Restart Next.js after changing environment values.

The backend must allow the frontend origin (`CLIENT_ORIGIN=http://localhost:3000`) so its refresh-token cookie can be used. Keep the frontend and API on same-site hosts in production, and set the backend `STRIPE_SUCCESS_URL` and `STRIPE_CANCEL_URL` to the public frontend's `/payment/success` and `/payment/cancel` pages. Never expose backend secrets in `NEXT_PUBLIC_*` variables.

## Connected API flows

- Sign-in, registration, email verification/resend, password reset, current profile, refresh, and logout use the `/auth` routes.
- Public tracking uses `/parcels/track/:trackingNumber`.
- A verified customer sees only parcels addressed to their account email through `/customers/me/parcels`, can cancel eligible pre-pickup parcels, and can start Stripe checkout for an out-for-delivery COD parcel.
- Merchants create recipients and parcels through `/customers` and `/parcels`; optional origin hubs come from the merchant's allowed `/operations/hubs` list. Parcel creation sends an idempotency key.
- Hub managers load their assigned hub's scoped parcel list, incoming transfers and local available riders. Dispatch destinations use the safe `/operations/transfer-destinations` directory; only a rider assigned to the parcel's current hub can be selected.
- Riders see their own active assignments and update delivery status. Admin accounts receive their API-scoped parcel view.

All browser API calls use the configured API base, unwrap the common API response envelope, include credentials, and retry once with the HTTP-only refresh cookie after an expired access token.

See [local setup](docs/local-setup.md), [API contracts](docs/api-contracts.md), [role access](docs/role-access.md), [session security](docs/session-security.md), and the [deployment guide](docs/deployment.md) for implementation details.

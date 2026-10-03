# API integration map

The browser client uses the common success envelope and prefixes requests with `NEXT_PUBLIC_API_BASE_URL` (default `/api/v1` on `localhost:4000`). Authenticated requests send the short-lived bearer token and include cookies; a `401` retries once after `/auth/refresh`.

| Frontend flow | API routes |
| --- | --- |
| Sign in and current session | `POST /auth/login`, `GET /auth/me`, `POST /auth/refresh`, `POST /auth/logout` |
| Registration and email verification | `POST /auth/register`, `POST /auth/verify-email`, `POST /auth/resend-verification` |
| Password recovery | `POST /auth/forgot-password`, `POST /auth/reset-password` |
| Public tracking | `GET /parcels/track/:trackingNumber` |
| Customer parcel portal | `GET /customers/me/parcels`, `POST /customers/me/parcels/:id/cancel` |
| Merchant booking | `GET/POST /customers`, `GET /operations/hubs`, `POST /parcels`, `POST /parcels/:id/assign-origin-hub` |
| Hub routing and receipt | `GET /parcels`, `GET /operations/hubs`, `GET /operations/transfer-destinations`, `GET /operations/inbound-transfers`, `POST /parcels/:id/dispatch`, `POST /parcels/:id/mark-arrived` |
| Rider delivery | `GET /operations/riders?hubId=...`, `POST /parcels/:id/assign-rider`, `PATCH /parcels/:id/status` |
| COD online payment | `POST /payments/stripe/customer-checkout`; Stripe returns to `/payment/success` or `/payment/cancel` |

Parcel booking sends an `Idempotency-Key`. The API remains responsible for role authorization, hub scope, ownership checks, transition validation, and payment confirmation.

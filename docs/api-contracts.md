# API integration map

The browser client uses the common success envelope and prefixes requests with `NEXT_PUBLIC_API_BASE_URL` (default `/api/v1` on `localhost:4000`). Authenticated requests send the short-lived bearer token and include cookies; a `401` retries once after `/auth/refresh`.

| Frontend flow | API routes |
| --- | --- |
| Sign in and current session | `POST /auth/login`, `POST /auth/google`, `GET /auth/me`, `PATCH /auth/me`, `POST /auth/refresh`, `POST /auth/logout` |
| Registration and email verification | `POST /auth/register`, `POST /auth/verify-email`, `GET /auth/verify-email`, `POST /auth/resend-verification` |
| Password recovery | `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/reset-password` |
| Administrator setup | `POST /auth/admins` from the super-admin workspace |
| Public tracking | `GET /parcels/track/:trackingNumber` |
| Customer parcel portal | `GET /customers/me/parcels`, `POST /customers/me/parcels/:id/cancel` |
| Merchant booking | `GET/POST /customers`, `GET /operations/hubs`, `POST /parcels`, `POST /parcels/:id/assign-origin-hub` |
| Hub routing and receipt | `GET /parcels`, `GET /operations/hubs`, `GET /operations/transfer-destinations`, `GET /operations/inbound-transfers`, `POST /parcels/:id/dispatch`, `POST /parcels/:id/mark-arrived` |
| Admin operations directory | GET/POST /operations/branches, GET/POST /operations/hubs, GET/POST /operations/vehicles, GET/POST /operations/riders, GET/POST /operations/hub-managers, PATCH /operations/hub-managers/:id/hub |
| Rider delivery | `GET /operations/riders?hubId=...`, `POST /parcels/:id/assign-rider`, `PATCH /parcels/:id/status` |
| COD online payment | `POST /payments/stripe/customer-checkout` for recipient phone verification; authenticated `POST /payments/stripe/checkout` for a parcel; Stripe returns to `/payment/success` or `/payment/cancel`; `GET /payments/stripe/checkout/:sessionId/status` confirms the result |

Parcel booking sends an `Idempotency-Key`. The API remains responsible for role authorization, hub scope, ownership checks, transition validation, and payment confirmation.

The Google sign-in button is enabled when `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is configured. It sends Google's ID credential to `POST /auth/google` as `credential`; configure the matching Google client ID in the backend as well. The verification and reset pages accept email-link query values (`token` or `code`) and call the corresponding GET route.

`POST /payments/stripe/webhook` is Stripe's server-to-server callback. The browser must not call it; Stripe signature verification and payment updates stay on the API.

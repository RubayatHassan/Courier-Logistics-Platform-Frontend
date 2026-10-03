# Deployment notes

1. Set `NEXT_PUBLIC_API_BASE_URL` to the public API base ending in `/api/v1` and build the frontend with `pnpm build`.
2. Configure backend `CLIENT_ORIGIN` to the deployed frontend origin. The refresh cookie must be accepted on the deployment's same-site frontend/API hosts, and backend CORS must allow credentials for that exact origin.
3. Configure backend `STRIPE_SUCCESS_URL` and `STRIPE_CANCEL_URL` to the deployed `/payment/success` and `/payment/cancel` pages.
4. Keep API secrets and Stripe signing secrets on the backend only. Rebuild the frontend when changing `NEXT_PUBLIC_API_BASE_URL`.
5. Verify sign-in, email verification, role scope, transfer receipt, and Stripe webhook confirmation against a non-production environment before enabling a live rollout.

The production server command is `pnpm start`; use a platform that supports the selected Next.js deployment mode and Node.js 20.9 or later.

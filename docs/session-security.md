# Session and customer data

- Access tokens stay in tab-scoped `sessionStorage`; they are not written to persistent browser storage.
- Refresh requests include cookies so the backend can use its HTTP-only refresh cookie. Keep frontend and API on same-site hosts, enable credentials in backend CORS, and set `CLIENT_ORIGIN` to the frontend origin.
- The frontend does not treat route visibility as authorization. Backend routes must continue checking the user role, merchant ownership, exact managed hub, customer verified email, and parcel state.
- A customer's parcel list and cancellation use customer-specific API routes. Do not replace them with broad merchant parcel data in the browser.
- Do not place API secrets, signing keys, or payment credentials in `NEXT_PUBLIC_*` environment variables.
- Payment completion must be recorded by the backend's trusted Stripe confirmation flow; the success page only explains that confirmation is pending.

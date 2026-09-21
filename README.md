# Coinflow ACH Authorization POC

Product-style ACH debit authorization demo for Coinflow — all ACH `orderType` values from the [Implement ACH](https://docs.coinflow.cash/guides/checkout/payment-methods/payment-methods/ach/implement-ach) guide — presented as a merchant app (“Harbor”).

| Order type | Catalog example |
|------------|-----------------|
| `one_time_purchase` | Studio Desk Lamp |
| `recurring_subscription` | Harbor Pro (monthly) |
| `recurring_balance_top_up` | Wallet auto-refill |
| `limit_order` | Harbor Credits — limit buy |
| `fair_market_value` | Harbor Credits — market fill |

## Setup

```bash
cp .env.example .env
# fill in VITE_COINFLOW_API_KEY and VITE_COINFLOW_MERCHANT_ID
npm install
npm run dev
```

Open [http://localhost:5174](http://localhost:5174).

## Environment

```env
VITE_COINFLOW_API_KEY=your_sandbox_api_key
VITE_COINFLOW_MERCHANT_ID=your_merchant_id
VITE_COINFLOW_ENV=sandbox
```

Your merchant may need `allowedOrderTypes` configured for all five types — contact Coinflow integrations if a type is rejected.

Optional:

```env
VITE_COINFLOW_API_BASE=   # usually leave unset; local uses Vite proxy /coinflow-api
```

## Shopper flow

1. Sign in with email + accept Terms (including E-SIGN Consent)
2. Shop — pick any order type
3. Checkout — link bank, authorize ACH (type-specific disclosure + `structuredTerms`), confirm
4. Receipt
5. Account — revoke authorization

## API sequence (implementation)

1. `POST /checkout/jwt-token`
2. `POST /checkout/totals/{merchantId}`
3. `POST /customer/v2/bankAccount` / `GET /customer/v2`
4. Authorization form (UI)
5. `POST /checkout/ach-authorization` (+ `orderType` / `structuredTerms`)
6. `POST /checkout/ach/{merchantId}` (+ `achAuthorizationId` / `orderType`)
7. Status / `PATCH .../revoke` from Account

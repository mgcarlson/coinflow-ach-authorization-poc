# Coinflow ACH Authorization POC

Product-style ACH debit authorization demo for Coinflow — one-time purchase and recurring subscription — presented as a merchant app (“Harbor”).

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

Optional:

```env
VITE_COINFLOW_API_BASE=   # usually leave unset; local uses Vite proxy /coinflow-api
```

## Shopper flow

1. Sign in with email + accept Terms (including E-SIGN Consent)
2. Shop — one-time item or monthly plan
3. Checkout — link bank, authorize ACH, confirm
4. Receipt
5. Account — cancel subscription / authorization

## API sequence (implementation)

1. `POST /checkout/jwt-token`
2. `POST /checkout/totals/{merchantId}`
3. `POST /customer/v2/bankAccount` / `GET /customer/v2`
4. Authorization form (UI)
5. `POST /checkout/ach-authorization`
6. `POST /checkout/ach/{merchantId}`
7. Status / `PATCH .../revoke` from Account

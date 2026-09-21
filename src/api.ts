export type Cents = { cents: number; currency?: string };

export type OrderType =
  | "one_time_purchase"
  | "recurring_subscription"
  | "recurring_balance_top_up"
  | "limit_order"
  | "fair_market_value";

export type SubscriptionFrequency = "daily" | "weekly" | "monthly" | "yearly";

export type StatusEventType =
  | "fully_filled"
  | "archived"
  | "reopened"
  | "deadline_passed_no_shipment";

export type StructuredTerms =
  | Record<string, never>
  | {
      frequency: SubscriptionFrequency;
      subscriptionAmount: Cents;
    }
  | {
      topUpTriggerAmount: Cents;
      topUpMaxAmount: Cents;
    }
  | {
      bidPrice: Cents;
      minQuantity: number;
      maxQuantity: number;
      maximumTotal: Cents;
    }
  | {
      minQuantity: number;
      minFairValue?: Cents;
      maxFairValue: Cents;
      maximumTotal: Cents;
    };

export type CreateAchAuthorizationBody = {
  renderedAuthorizationText: string;
  consentTimestamp: string;
  sessionAuthRef: string;
  idempotencyKey: string;
  token: string;
  orderType: OrderType;
  structuredTerms: StructuredTerms;
};

export type AchAuthorization = {
  _id: string;
  paymentId?: string | null;
  revoked?: boolean;
  revokedAt?: string | null;
  orderType?: OrderType | string;
  accountLastFour?: string;
  routingNumber?: string;
  statusHistory?: Array<Record<string, unknown>>;
  [key: string]: unknown;
};

export type LinkedBankAccount = {
  token: string;
  alias?: string;
  last4?: string;
  routingNumber?: string;
  type?: string;
};

export type ApiResult<T = Record<string, unknown>> = {
  ok: boolean;
  status: number;
  data: T;
  text: string;
};

export function getApiBase(): string {
  const fromEnv = import.meta.env.VITE_COINFLOW_API_BASE?.replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  if (import.meta.env.DEV) return "/coinflow-api";
  return import.meta.env.VITE_COINFLOW_ENV === "prod"
    ? "https://api.coinflow.cash/api"
    : "https://api-sandbox.coinflow.cash/api";
}

export function getMerchantId(): string {
  return import.meta.env.VITE_COINFLOW_MERCHANT_ID?.trim() || "maddie";
}

async function parseJson<T>(res: Response): Promise<ApiResult<T>> {
  const text = await res.text();
  let data = {} as T;
  try {
    data = JSON.parse(text) as T;
  } catch {
    data = { raw: text } as T;
  }
  return { ok: res.ok, status: res.status, data, text };
}

export function formatApiError(result: ApiResult): string {
  const d = result.data as Record<string, unknown>;
  if (typeof d.message === "string") {
    const details = d.details;
    if (details && typeof details === "object") {
      return `${d.message}: ${JSON.stringify(details)}`;
    }
    if (typeof details === "string") return `${d.message}: ${details}`;
    return d.message;
  }
  if (typeof d.details === "string") return d.details;
  if (typeof d.error === "string") return d.error;
  return `Request failed (${result.status})`;
}

function apiKey(): string {
  const auth = import.meta.env.VITE_COINFLOW_API_KEY?.trim();
  if (!auth) throw new Error("Set VITE_COINFLOW_API_KEY in .env");
  return auth;
}

export async function fetchSessionKey(userId: string): Promise<string> {
  const uid = userId.trim();
  if (!uid) throw new Error("Shopper ID is required");
  const headers: Record<string, string> = {
    Authorization: apiKey(),
    "x-coinflow-auth-user-id": uid,
  };
  const mid = import.meta.env.VITE_COINFLOW_MERCHANT_ID?.trim();
  if (mid) headers["x-coinflow-auth-merchant-id"] = mid;

  const res = await fetch(`${getApiBase()}/auth/session-key`, {
    method: "GET",
    headers,
  });
  const result = await parseJson<{ key?: string }>(res);
  if (!result.ok || !result.data.key) {
    throw new Error(formatApiError(result) || `Session key ${result.status}`);
  }
  return result.data.key;
}

export async function postCheckoutJwtToken(args: {
  subtotalCents: number;
  currency?: string;
  email?: string;
}): Promise<ApiResult<{ jwtToken?: string; checkoutJwtToken?: string }>> {
  const body: Record<string, unknown> = {
    subtotal: {
      cents: args.subtotalCents,
      currency: args.currency ?? "USD",
    },
  };
  if (args.email?.trim()) body.email = args.email.trim();

  const res = await fetch(`${getApiBase()}/checkout/jwt-token`, {
    method: "POST",
    headers: {
      Authorization: apiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return parseJson(res);
}

export function extractJwtToken(
  data: Record<string, unknown>
): string | null {
  for (const key of ["jwtToken", "checkoutJwtToken", "token"]) {
    const v = data[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

export async function postCheckoutTotals(args: {
  sessionKey: string;
  subtotalCents: number;
  currency?: string;
  jwtToken?: string;
  merchantId?: string;
}): Promise<ApiResult> {
  const merchantId = args.merchantId ?? getMerchantId();
  const body: Record<string, unknown> = {
    subtotal: {
      cents: args.subtotalCents,
      currency: args.currency ?? "USD",
    },
  };
  if (args.jwtToken?.trim()) body.jwtToken = args.jwtToken.trim();

  const res = await fetch(
    `${getApiBase()}/checkout/totals/${encodeURIComponent(merchantId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-coinflow-auth-session-key": args.sessionKey,
      },
      body: JSON.stringify(body),
    }
  );
  return parseJson(res);
}

export async function postCustomerBankAccount(args: {
  userId: string;
  email: string;
  routingNumber: string;
  accountNumber: string;
  type?: "checking" | "savings";
  alias?: string;
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  state: string;
  zip: string;
}): Promise<ApiResult<{ token?: string }>> {
  const res = await fetch(`${getApiBase()}/customer/v2/bankAccount`, {
    method: "POST",
    headers: {
      Authorization: apiKey(),
      "Content-Type": "application/json",
      "x-coinflow-auth-user-id": args.userId.trim(),
    },
    body: JSON.stringify({
      type: args.type ?? "checking",
      email: args.email.trim(),
      alias: args.alias?.trim() || "Checking",
      routingNumber: args.routingNumber.trim(),
      account_number: args.accountNumber.trim(),
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      address1: args.address1.trim(),
      city: args.city.trim(),
      state: args.state.trim(),
      zip: args.zip.trim(),
    }),
  });
  return parseJson(res);
}

export async function fetchCustomerBanks(
  sessionKey: string
): Promise<LinkedBankAccount[]> {
  const res = await fetch(`${getApiBase()}/customer/v2`, {
    method: "GET",
    headers: { "x-coinflow-auth-session-key": sessionKey },
  });
  const result = await parseJson<Record<string, unknown>>(res);
  if (!result.ok) throw new Error(formatApiError(result));

  const banks: LinkedBankAccount[] = [];
  const push = (item: unknown) => {
    if (!item || typeof item !== "object") return;
    const o = item as Record<string, unknown>;
    const token =
      (typeof o.token === "string" && o.token) ||
      (typeof o.account === "string" && o.account) ||
      null;
    if (!token) return;
    banks.push({
      token,
      alias: typeof o.alias === "string" ? o.alias : undefined,
      type: typeof o.type === "string" ? o.type : undefined,
      last4:
        typeof o.last4 === "string"
          ? o.last4
          : typeof o.accountLastFour === "string"
            ? o.accountLastFour
            : typeof o.accountNumberLast4 === "string"
              ? o.accountNumberLast4
              : undefined,
      routingNumber:
        typeof o.routingNumber === "string" ? o.routingNumber : undefined,
    });
  };

  const data = result.data;
  const candidates = [
    data.bankAccounts,
    data.banks,
    data.accounts,
    (data.customer as Record<string, unknown> | undefined)?.bankAccounts,
  ];
  for (const c of candidates) {
    if (Array.isArray(c)) c.forEach(push);
  }
  return banks;
}

export async function createAchAuthorization(args: {
  sessionKey: string;
  body: CreateAchAuthorizationBody;
}): Promise<ApiResult<AchAuthorization>> {
  const res = await fetch(`${getApiBase()}/checkout/ach-authorization`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-coinflow-auth-session-key": args.sessionKey,
    },
    body: JSON.stringify(args.body),
  });
  return parseJson<AchAuthorization>(res);
}

export async function postAchCheckout(args: {
  sessionKey: string;
  subtotalCents: number;
  token: string;
  jwtToken: string;
  achAuthorizationId: string;
  orderType: OrderType;
  merchantId?: string;
}): Promise<ApiResult> {
  const merchantId = args.merchantId ?? getMerchantId();
  const res = await fetch(
    `${getApiBase()}/checkout/ach/${encodeURIComponent(merchantId)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-coinflow-auth-session-key": args.sessionKey,
      },
      body: JSON.stringify({
        subtotal: { cents: args.subtotalCents, currency: "USD" },
        jwtToken: args.jwtToken,
        token: args.token,
        orderType: args.orderType,
        achAuthorizationId: args.achAuthorizationId,
      }),
    }
  );
  return parseJson(res);
}

export async function putAchAuthorizationStatus(args: {
  authorizationId: string;
  eventType: StatusEventType;
  eventTimestamp?: string;
}): Promise<ApiResult> {
  const res = await fetch(
    `${getApiBase()}/checkout/ach-authorization/${encodeURIComponent(
      args.authorizationId
    )}/status`,
    {
      method: "PUT",
      headers: {
        Authorization: apiKey(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        eventType: args.eventType,
        eventTimestamp: args.eventTimestamp ?? new Date().toISOString(),
      }),
    }
  );
  return parseJson(res);
}

export async function revokeAchAuthorization(
  authorizationId: string
): Promise<ApiResult> {
  const res = await fetch(
    `${getApiBase()}/checkout/ach-authorization/${encodeURIComponent(
      authorizationId
    )}/revoke`,
    {
      method: "PATCH",
      headers: { Authorization: apiKey() },
    }
  );
  return parseJson(res);
}

export function extractPaymentId(data: Record<string, unknown>): string | null {
  for (const key of ["paymentId", "payment_id", "id"]) {
    const v = data[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
}

export function extractBankToken(
  data: Record<string, unknown>
): string | null {
  if (typeof data.token === "string" && data.token.trim()) return data.token.trim();
  return null;
}

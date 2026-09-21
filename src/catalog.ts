import type {
  OrderType,
  StructuredTerms,
  SubscriptionFrequency,
} from "./api";

export const MERCHANT_NAME = "Harbor";
export const MERCHANT_SUPPORT = "support@harbor.com";

export type CatalogItem = {
  id: string;
  orderType: OrderType;
  title: string;
  description: string;
  /** Amount charged on the founding ACH checkout (cents). */
  amountCents: number;
  frequency?: SubscriptionFrequency;
  /** recurring_balance_top_up */
  topUpTriggerCents?: number;
  topUpMaxCents?: number;
  /** limit_order / fair_market_value */
  bidPriceCents?: number;
  minQuantity?: number;
  maxQuantity?: number;
  maximumTotalCents?: number;
  minFairValueCents?: number;
  maxFairValueCents?: number;
};

export const CATALOG: CatalogItem[] = [
  {
    id: "lamp-4821",
    orderType: "one_time_purchase",
    title: "Studio Desk Lamp",
    description: "Matte black aluminum, warm LED. Ships in 3–5 days.",
    amountCents: 15000,
  },
  {
    id: "pro-monthly",
    orderType: "recurring_subscription",
    title: "Harbor Pro",
    description: "Unlimited workspace seats, priority support, and early access.",
    amountCents: 2900,
    frequency: "monthly",
  },
  {
    id: "wallet-refill",
    orderType: "recurring_balance_top_up",
    title: "Wallet auto-refill",
    description:
      "When your Harbor balance drops below $50, we refill up to $200 from your bank.",
    amountCents: 10000,
    topUpTriggerCents: 5000,
    topUpMaxCents: 20000,
  },
  {
    id: "credit-limit",
    orderType: "limit_order",
    title: "Harbor Credits — limit buy",
    description:
      "Buy between 10 and 100 credits when the bid price hits $2.50 each (max $250).",
    amountCents: 25000,
    bidPriceCents: 250,
    minQuantity: 10,
    maxQuantity: 100,
    maximumTotalCents: 25000,
  },
  {
    id: "credit-fmv",
    orderType: "fair_market_value",
    title: "Harbor Credits — market fill",
    description:
      "Fill at fair market value for 5–50 credits, up to $200 total.",
    amountCents: 20000,
    minQuantity: 5,
    maxQuantity: 50,
    minFairValueCents: 150,
    maxFairValueCents: 400,
    maximumTotalCents: 20000,
  },
];

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function orderTypeLabel(orderType: OrderType): string {
  switch (orderType) {
    case "one_time_purchase":
      return "One-time";
    case "recurring_subscription":
      return "Subscription";
    case "recurring_balance_top_up":
      return "Auto top-up";
    case "limit_order":
      return "Limit order";
    case "fair_market_value":
      return "Market fill";
  }
}

export function catalogPriceLabel(item: CatalogItem): string {
  switch (item.orderType) {
    case "recurring_subscription":
      return `${dollars(item.amountCents)}${
        item.frequency ? ` / ${item.frequency}` : ""
      }`;
    case "recurring_balance_top_up":
      return `Up to ${dollars(item.topUpMaxCents ?? item.amountCents)}`;
    case "limit_order":
      return `Max ${dollars(item.maximumTotalCents ?? item.amountCents)}`;
    case "fair_market_value":
      return `Max ${dollars(item.maximumTotalCents ?? item.amountCents)}`;
    default:
      return dollars(item.amountCents);
  }
}

export function catalogCtaLabel(item: CatalogItem): string {
  switch (item.orderType) {
    case "one_time_purchase":
      return "Buy with ACH";
    case "recurring_subscription":
      return "Subscribe";
    case "recurring_balance_top_up":
      return "Set up top-up";
    case "limit_order":
      return "Place limit order";
    case "fair_market_value":
      return "Place market order";
  }
}

export function confirmCtaLabel(item: CatalogItem): string {
  switch (item.orderType) {
    case "one_time_purchase":
      return "Confirm purchase";
    case "recurring_subscription":
      return "Confirm subscription";
    case "recurring_balance_top_up":
      return "Confirm auto-refill";
    case "limit_order":
      return "Confirm limit order";
    case "fair_market_value":
      return "Confirm market order";
  }
}

export function receiptTitle(item: CatalogItem): string {
  switch (item.orderType) {
    case "one_time_purchase":
      return "Purchase confirmed";
    case "recurring_subscription":
      return "Subscription started";
    case "recurring_balance_top_up":
      return "Auto-refill enabled";
    case "limit_order":
      return "Limit order placed";
    case "fair_market_value":
      return "Market order placed";
  }
}

export function cancelLabel(item: CatalogItem): string {
  switch (item.orderType) {
    case "recurring_subscription":
      return "Cancel subscription";
    case "recurring_balance_top_up":
      return "Cancel auto-refill";
    case "limit_order":
    case "fair_market_value":
      return "Cancel order";
    default:
      return "Cancel authorization";
  }
}

/** Build `structuredTerms` for POST /checkout/ach-authorization. */
export function buildStructuredTerms(item: CatalogItem): StructuredTerms {
  switch (item.orderType) {
    case "one_time_purchase":
      return {};
    case "recurring_subscription":
      return {
        frequency: item.frequency ?? "monthly",
        subscriptionAmount: { cents: item.amountCents },
      };
    case "recurring_balance_top_up":
      return {
        topUpTriggerAmount: {
          cents: item.topUpTriggerCents ?? 5000,
        },
        topUpMaxAmount: {
          cents: item.topUpMaxCents ?? item.amountCents,
        },
      };
    case "limit_order":
      return {
        bidPrice: { cents: item.bidPriceCents ?? 250 },
        minQuantity: item.minQuantity ?? 1,
        maxQuantity: item.maxQuantity ?? 1,
        maximumTotal: {
          cents: item.maximumTotalCents ?? item.amountCents,
        },
      };
    case "fair_market_value":
      return {
        minQuantity: item.minQuantity ?? 1,
        ...(item.minFairValueCents != null
          ? { minFairValue: { cents: item.minFairValueCents } }
          : {}),
        maxFairValue: {
          cents: item.maxFairValueCents ?? item.amountCents,
        },
        maximumTotal: {
          cents: item.maximumTotalCents ?? item.amountCents,
        },
      };
  }
}

export function buildAuthorizationText(args: {
  orderType: OrderType;
  amountCents: number;
  productTitle: string;
  orderLabel: string;
  frequency?: SubscriptionFrequency;
  startDate?: Date;
  topUpTriggerCents?: number;
  topUpMaxCents?: number;
  bidPriceCents?: number;
  minQuantity?: number;
  maxQuantity?: number;
  maximumTotalCents?: number;
  minFairValueCents?: number;
  maxFairValueCents?: number;
}): string {
  const amount = dollars(args.amountCents);
  const merchant = MERCHANT_NAME;

  if (args.orderType === "one_time_purchase") {
    return [
      "Payment made via ACH debit transfers funds from your account using the ACH network.",
      "",
      `I authorize ${merchant} to debit my account ${amount} for ${args.orderLabel}. If necessary, I also authorize ${merchant} to electronically credit my account to correct an erroneous debit. This is a one-time debit. No further debits will be made under this authorization. I agree this complies with applicable law.`,
      "",
      "I may cancel this purchase at any time before selecting Confirm below.",
    ].join("\n");
  }

  if (args.orderType === "recurring_subscription") {
    const frequency = args.frequency ?? "monthly";
    const start = formatDate(args.startDate ?? new Date());
    return [
      "Payment made via ACH debit transfers funds from your account using the ACH network.",
      "",
      `I authorize ${merchant} to debit my account ${amount} on a ${frequency} basis for ${args.productTitle}, beginning on ${start}, until I cancel. Debits occur automatically with no advance notice for each recurring charge, and I can check my subscription status at any time. I agree this complies with applicable law.`,
      "",
      `I may revoke this authorization at any time by canceling my subscription in account settings or by contacting ${merchant} at ${MERCHANT_SUPPORT}.`,
    ].join("\n");
  }

  if (args.orderType === "recurring_balance_top_up") {
    const trigger = dollars(args.topUpTriggerCents ?? 5000);
    const max = dollars(args.topUpMaxCents ?? args.amountCents);
    return [
      "Payment made via ACH debit transfers funds from your account using the ACH network.",
      "",
      `I authorize ${merchant} to debit my account automatically for ${args.productTitle} whenever my Harbor balance falls below ${trigger}, in an amount up to ${max} per top-up, until I cancel. An initial debit of ${amount} may be processed today to fund my balance. Debits may occur without advance notice for each top-up. I agree this complies with applicable law.`,
      "",
      `I may revoke this authorization at any time in account settings or by contacting ${merchant} at ${MERCHANT_SUPPORT}.`,
    ].join("\n");
  }

  if (args.orderType === "limit_order") {
    const bid = dollars(args.bidPriceCents ?? 250);
    const minQ = args.minQuantity ?? 1;
    const maxQ = args.maxQuantity ?? 1;
    const maxTotal = dollars(args.maximumTotalCents ?? args.amountCents);
    return [
      "Payment made via ACH debit transfers funds from your account using the ACH network.",
      "",
      `I authorize ${merchant} to debit my account for ${args.productTitle} when my limit order fills: bid price ${bid}, quantity between ${minQ} and ${maxQ}, not to exceed ${maxTotal} in total. Debits may occur in one or more installments as the order fills, without advance notice for each debit, until the order is filled, canceled, or expires. I agree this complies with applicable law.`,
      "",
      `I may revoke this authorization at any time by canceling the order in account settings or by contacting ${merchant} at ${MERCHANT_SUPPORT}.`,
    ].join("\n");
  }

  const minQ = args.minQuantity ?? 1;
  const maxQ = args.maxQuantity ?? minQ;
  const maxFv = dollars(args.maxFairValueCents ?? args.amountCents);
  const minFv =
    args.minFairValueCents != null
      ? dollars(args.minFairValueCents)
      : null;
  const maxTotal = dollars(args.maximumTotalCents ?? args.amountCents);
  const valueRange = minFv
    ? `between ${minFv} and ${maxFv} per unit`
    : `up to ${maxFv} per unit`;

  return [
    "Payment made via ACH debit transfers funds from your account using the ACH network.",
    "",
    `I authorize ${merchant} to debit my account for ${args.productTitle} when filled at fair market value ${valueRange}, for a quantity between ${minQ} and ${maxQ}, not to exceed ${maxTotal} in total. Debits may occur in one or more installments as the order fills, without advance notice for each debit, until the order is filled, canceled, or expires. I agree this complies with applicable law.`,
    "",
    `I may revoke this authorization at any time by canceling the order in account settings or by contacting ${merchant} at ${MERCHANT_SUPPORT}.`,
  ].join("\n");
}

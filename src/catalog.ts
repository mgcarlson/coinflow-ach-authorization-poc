import type { OrderType, SubscriptionFrequency } from "./api";

export const MERCHANT_NAME = "Harbor";
export const MERCHANT_SUPPORT = "support@harbor.com";

export type CatalogItem = {
  id: string;
  orderType: OrderType;
  title: string;
  description: string;
  amountCents: number;
  frequency?: SubscriptionFrequency;
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
];

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function buildAuthorizationText(args: {
  orderType: OrderType;
  amountCents: number;
  productTitle: string;
  orderLabel: string;
  frequency?: SubscriptionFrequency;
  startDate?: Date;
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

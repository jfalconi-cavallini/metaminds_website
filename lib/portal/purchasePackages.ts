import type { PurchaseOption } from "./types";

/**
 * The only Stripe Payment Links the portal may open.
 * Checkout and webhooks are not wired. Paying does not add hours.
 * An admin adds them after the payment is confirmed.
 */
export const HOUR_PACKAGE_PAYMENT_LINKS = {
  "1hr": "https://buy.stripe.com/8x23cndJXcvQ4JgcIj8AE01",
  "4hr": "https://buy.stripe.com/5kQ14fbBP7bw7Vs7nZ8AE02",
  "8hr": "https://buy.stripe.com/aFaaEP49n0N8a3A8s38AE03",
} as const;

export const purchaseOptions: PurchaseOption[] = [
  { id: "1hr", label: "1 Hour",  hours: 1, price: 70,  priceLabel: "$70",  paymentUrl: HOUR_PACKAGE_PAYMENT_LINKS["1hr"] },
  { id: "4hr", label: "4 Hours", hours: 4, price: 260, priceLabel: "$260", paymentUrl: HOUR_PACKAGE_PAYMENT_LINKS["4hr"] },
  { id: "8hr", label: "8 Hours", hours: 8, price: 480, priceLabel: "$480", paymentUrl: HOUR_PACKAGE_PAYMENT_LINKS["8hr"] },
];

export function isKnownHourPackage(label: string, hours: number, price: number): boolean {
  return purchaseOptions.some(
    (opt) => opt.label === label && opt.hours === hours && opt.price === price,
  );
}

/** Parent and student hours-tab copy. Keep these free of hyphens and dashes. */
export const purchaseCopy = {
  payNow: "Pay now",
  requestPurchase: "Request purchase",
  requestSent: "Request sent",
  submitting: "Submitting…",
  saveFailed: "Could not save the request. Please try again.",
  noticeFailed: "We could not send the admin notice. The request is still saved.",
  footnote:
    "Pay now opens Stripe in a new tab. Send a request too so we know which student to add the hours to. Hours are added to the account after the payment is confirmed. An admin adds them manually for now.",
} as const;

export function purchasePanelTitle(childName?: string): string {
  return childName ? `Choose a package for ${childName}.` : "Choose a package.";
}

export function purchaseSavedMessage(label: string, childName?: string): string {
  const who = childName ? ` for ${childName}` : "";
  return `Request saved for ${label}${who}. Hours are added to the account after the payment is confirmed.`;
}

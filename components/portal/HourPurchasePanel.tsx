"use client";

import type { PurchaseOption } from "@/lib/portal/types";
import { purchaseCopy, purchasePanelTitle } from "@/lib/portal/purchasePackages";

interface Props {
  childName?: string;
  options: PurchaseOption[];
  saving: boolean;
  requestedIds: ReadonlySet<string>;
  error: string;
  canPurchase: boolean;
  disabledTitle?: string;
  onRequest: (opt: PurchaseOption) => void;
}

export default function HourPurchasePanel({
  childName,
  options,
  saving,
  requestedIds,
  error,
  canPurchase,
  disabledTitle,
  onRequest,
}: Props) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-semibold text-gray-900 mb-3">{purchasePanelTitle(childName)}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
        {options.map((opt) => {
          const requested = requestedIds.has(opt.id);
          return (
            <div key={opt.id} className="bg-gray-50 border border-gray-200 rounded-xl p-5 flex flex-col">
              <p className="font-bold text-gray-900 text-lg">{opt.label}</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{opt.priceLabel}</p>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                {opt.hours} session hour{opt.hours > 1 ? "s" : ""}
              </p>
              {canPurchase ? (
                <a
                  href={opt.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${purchaseCopy.payNow} for ${opt.label}. Opens in a new tab.`}
                  className="mt-auto w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-medium text-center hover:bg-blue-700"
                >
                  {purchaseCopy.payNow}
                </a>
              ) : (
                <button
                  type="button"
                  disabled
                  title={disabledTitle}
                  className="mt-auto w-full py-2 rounded-lg bg-blue-600 text-white text-sm font-medium text-center opacity-40 cursor-not-allowed"
                >
                  {purchaseCopy.payNow}
                </button>
              )}
              <button
                type="button"
                onClick={() => onRequest(opt)}
                disabled={!canPurchase || saving || requested}
                title={!canPurchase ? disabledTitle : undefined}
                className="mt-2 w-full py-2 rounded-lg border border-blue-600 text-blue-600 text-sm font-medium hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {requested ? purchaseCopy.requestSent : saving ? purchaseCopy.submitting : purchaseCopy.requestPurchase}
              </button>
            </div>
          );
        })}
      </div>
      {error ? <p className="text-xs text-red-500 mb-2">{error}</p> : null}
      <p className="text-xs text-gray-400">{purchaseCopy.footnote}</p>
    </div>
  );
}

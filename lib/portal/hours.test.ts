import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatHours,
  normalizePurchasedHours,
  purchasedHoursError,
  roundHours,
} from "./hours.ts";

describe("purchasedHoursError", () => {
  it("accepts half-hour increments inside the range", () => {
    for (const hours of [0.5, 1, 3.5, 4, 8, 20, 100, "3.5", "0.5"]) {
      assert.equal(purchasedHoursError(hours), null, String(hours));
    }
  });

  it("rejects empty, non-numeric, non-positive, and out-of-range values", () => {
    assert.match(purchasedHoursError(""), /valid number/);
    assert.match(purchasedHoursError("abc"), /valid number/);
    assert.match(purchasedHoursError(Number.NaN), /valid number/);
    assert.match(purchasedHoursError(0), /at least/);
    assert.match(purchasedHoursError(-1), /at least/);
    assert.match(purchasedHoursError(0.25), /at least/);
    assert.match(purchasedHoursError(0.75), /half-hour/);
    assert.match(purchasedHoursError(3.7), /half-hour/);
    assert.match(purchasedHoursError(100.5), /exceed/);
    assert.match(purchasedHoursError(101), /exceed/);
  });
});

describe("normalizePurchasedHours", () => {
  it("snaps a validated amount onto an exact half hour", () => {
    assert.equal(normalizePurchasedHours(3.5), 3.5);
    assert.equal(normalizePurchasedHours(3.5000000001), 3.5);
    assert.equal(normalizePurchasedHours(4), 4);
  });
});

describe("formatHours", () => {
  it("keeps decimals and drops only trailing zeros", () => {
    assert.equal(formatHours(3.5), "3.5");
    assert.equal(formatHours(4), "4");
    assert.equal(formatHours(3.25), "3.25");
    assert.equal(formatHours(10.1 + 0.2), "10.3");
    assert.equal(roundHours(3.5), 3.5);
  });
});

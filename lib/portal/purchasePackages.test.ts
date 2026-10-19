import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";
import {
  HOUR_PACKAGE_PAYMENT_LINKS,
  isKnownHourPackage,
  purchaseCopy,
  purchaseOptions,
  purchasePanelTitle,
  purchaseSavedMessage,
} from "./purchasePackages.ts";
import {
  ADMIN_PORTAL_URL,
  adminNotifyRecipients,
  buildPurchaseRequestEmail,
  callerCanNotifyPurchase,
  purchaseNoticeIsFresh,
  PURCHASE_NOTICE_MAX_AGE_MS,
  resendSendFailed,
} from "./purchaseNotify.ts";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

const PAYMENT_LINKS = [
  "https://buy.stripe.com/8x23cndJXcvQ4JgcIj8AE01",
  "https://buy.stripe.com/5kQ14fbBP7bw7Vs7nZ8AE02",
  "https://buy.stripe.com/aFaaEP49n0N8a3A8s38AE03",
] as const;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === ".git" || name === ".claude") continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

describe("hour package payment links", () => {
  it("keeps the three existing Stripe Payment Links in one config", () => {
    assert.deepEqual(Object.values(HOUR_PACKAGE_PAYMENT_LINKS), [...PAYMENT_LINKS]);
    assert.deepEqual(purchaseOptions.map((opt) => opt.paymentUrl), [...PAYMENT_LINKS]);
    assert.deepEqual(
      purchaseOptions.map((opt) => [opt.id, opt.label, opt.hours, opt.price]),
      [
        ["1hr", "1 Hour", 1, 70],
        ["4hr", "4 Hours", 4, 260],
        ["8hr", "8 Hours", 8, 480],
      ],
    );
  });

  it("does not put those links in any other source file", () => {
    const hits = walk(root).filter((file) => {
      if (!/\.(ts|tsx|sql|md)$/.test(file)) return false;
      return readFileSync(file, "utf8").includes("buy.stripe.com");
    }).map((file) => path.relative(root, file));
    assert.deepEqual(hits.sort(), [
      "lib/portal/purchasePackages.test.ts",
      "lib/portal/purchasePackages.ts",
    ]);
  });
});

describe("purchase request migration 070", () => {
  it("lets a parent insert only for a linked child, and only the three packages", () => {
    const sql = readFileSync(path.join(root, "supabase/migrations/070_parent_purchase_requests.sql"), "utf8");
    assert.match(sql, /drop policy if exists "purchase_requests_insert"/);
    assert.match(sql, /my_role\(\) = 'parent' and student_id = any\(my_parent_student_ids\(\)\)/);
    assert.match(sql, /my_role\(\) = 'student' and student_id = my_linked_id\(\)/);
    for (const opt of purchaseOptions) {
      assert.match(sql, new RegExp(`package_label = '${opt.label}' and hours = ${opt.hours} and price = ${opt.price}`));
    }
    const numbered = readdirSync(path.join(root, "supabase/migrations"))
      .map((name) => Number(name.slice(0, 3)))
      .filter((n) => Number.isFinite(n));
    for (const taken of [63, 64, 65, 66, 67, 68, 69]) {
      assert.equal(numbered.includes(taken), false);
    }
    assert.equal(Math.max(...numbered), 70);
  });
});

describe("purchase notify", () => {
  it("reads ADMIN_NOTIFY_EMAIL and falls back to the documented admin list", () => {
    assert.deepEqual(adminNotifyRecipients({ ADMIN_NOTIFY_EMAIL: " jose@example.com , Jose@example.com" }), ["jose@example.com"]);
    assert.deepEqual(adminNotifyRecipients({ NEXT_PUBLIC_ADMIN_EMAIL: "a@example.com, b@example.com" }), ["a@example.com", "b@example.com"]);
    assert.deepEqual(adminNotifyRecipients({ ADMIN_NOTIFY_EMAIL: "jose@example.com", NEXT_PUBLIC_ADMIN_EMAIL: "other@example.com" }), ["jose@example.com"]);
    assert.deepEqual(adminNotifyRecipients({}), []);
  });

  it("allows a parent to notify for any linked child and nobody else", () => {
    assert.equal(callerCanNotifyPurchase({ role: "parent", linkedId: 1, studentId: 2, parentStudentIds: [1, 2] }), true);
    assert.equal(callerCanNotifyPurchase({ role: "parent", linkedId: 1, studentId: 1, parentStudentIds: [] }), true);
    assert.equal(callerCanNotifyPurchase({ role: "parent", linkedId: 1, studentId: 9, parentStudentIds: [1, 2] }), false);
    assert.equal(callerCanNotifyPurchase({ role: "student", linkedId: 4, studentId: 4, parentStudentIds: [] }), true);
    assert.equal(callerCanNotifyPurchase({ role: "student", linkedId: 4, studentId: 5, parentStudentIds: [5] }), false);
    assert.equal(callerCanNotifyPurchase({ role: "admin", linkedId: null, studentId: 4, parentStudentIds: [4] }), false);
    assert.equal(callerCanNotifyPurchase({ role: "tutor", linkedId: 3, studentId: 4, parentStudentIds: [] }), false);
  });

  it("accepts a notice only for a request that was just filed", () => {
    const now = Date.parse("2026-10-19T16:00:00.000Z");
    assert.equal(purchaseNoticeIsFresh("2026-10-19T15:50:00.000Z", now), true);
    assert.equal(purchaseNoticeIsFresh("2026-10-19T15:40:00.000Z", now), false);
    assert.equal(purchaseNoticeIsFresh("not-a-date", now), false);
    assert.equal(PURCHASE_NOTICE_MAX_AGE_MS, 15 * 60 * 1000);
  });

  it("treats a Resend error object as failure and a null error as success", () => {
    assert.equal(resendSendFailed(null), null);
    assert.equal(resendSendFailed(undefined), null);
    assert.equal(resendSendFailed({ message: "Invalid API key", name: "validation_error" }), "Invalid API key");
    assert.equal(resendSendFailed({}), "Resend returned an error");
  });

  it("includes the parent, the student, the package, and the admin portal link", () => {
    const { subject, html } = buildPurchaseRequestEmail({
      parentName: "Alex Rivera",
      parentEmail: "alex@example.com",
      studentName: "Jordan <Lee>",
      studentEmail: "jordan@example.com",
      packageLabel: "4 Hours",
      hours: 4,
      price: 260,
      filedBy: "parent",
      requestId: 12,
    });
    assert.equal(subject, "Hour purchase request for Jordan <Lee>");
    assert.match(html, /Alex Rivera \(alex@example.com\)/);
    assert.match(html, /Jordan &lt;Lee&gt;/);
    assert.doesNotMatch(html, /Jordan <Lee>/);
    assert.match(html, /4 Hours, 4 hours, \$260/);
    assert.match(html, new RegExp(ADMIN_PORTAL_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.equal(ADMIN_PORTAL_URL, "https://metamindsstemacademy.com/portal/admin");
    assert.equal(isKnownHourPackage("4 Hours", 4, 260), true);
    assert.equal(isKnownHourPackage("20 Hours", 20, 1000), false);
  });
});

describe("purchase copy", () => {
  it("stays plain and does not use dashes", () => {
    const strings = [
      ...Object.values(purchaseCopy),
      purchasePanelTitle("Jordan Lee"),
      purchasePanelTitle(),
      purchaseSavedMessage("4 Hours", "Jordan Lee"),
      purchaseSavedMessage("1 Hour"),
    ];
    for (const text of strings) {
      assert.equal(/[-\u2010-\u2015]/.test(text), false, text);
    }
    assert.match(purchaseCopy.footnote, /after the payment is confirmed/);
    assert.match(purchaseCopy.footnote, /manually for now/);
    assert.match(purchaseSavedMessage("8 Hours"), /after the payment is confirmed/);
  });
});

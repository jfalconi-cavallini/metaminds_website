import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CONTACT_LIMITS,
  buildContactEmail,
  isHoneypotTripped,
  validateContactFields,
} from "./contactForm.ts";

const valid = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  message: "What ages do you tutor?",
};

describe("validateContactFields", () => {
  it("accepts a normal question", () => {
    const result = validateContactFields(valid);
    assert.equal(result.ok, true);
    if (result.ok) assert.deepEqual(result.value, valid);
  });

  it("trims surrounding whitespace", () => {
    const result = validateContactFields({
      name: "  Ada Lovelace  ",
      email: "  ada@example.com  ",
      message: "  What ages do you tutor?  ",
    });
    assert.equal(result.ok, true);
    if (result.ok) assert.deepEqual(result.value, valid);
  });

  it("rejects a short name, a bad email, and a short message", () => {
    const result = validateContactFields({ name: "A", email: "not-an-email", message: "short" });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.errors.name, /at least 2/);
      assert.match(result.errors.email, /valid email/);
      assert.match(result.errors.message, /at least 10/);
    }
  });

  it("rejects fields over the length limit", () => {
    const result = validateContactFields({
      name: "N".repeat(CONTACT_LIMITS.nameMax + 1),
      email: `${"a".repeat(CONTACT_LIMITS.emailMax)}@example.com`,
      message: "m".repeat(CONTACT_LIMITS.messageMax + 1),
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.errors.name, /or fewer/);
      assert.match(result.errors.email, /valid email/);
      assert.match(result.errors.message, /or fewer/);
    }
  });

  it("rejects control characters in the name and message", () => {
    const result = validateContactFields({
      name: "Ada\nLovelace",
      email: "ada@example.com",
      message: "Hello\u0000there friend",
    });
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.match(result.errors.name, /invalid characters/);
      assert.match(result.errors.message, /invalid characters/);
    }
  });

  it("keeps line breaks in the message", () => {
    const result = validateContactFields({
      ...valid,
      message: "First line of the question.\nSecond line stays.",
    });
    assert.equal(result.ok, true);
  });
});

describe("isHoneypotTripped", () => {
  it("ignores an empty honeypot", () => {
    assert.equal(isHoneypotTripped(""), false);
    assert.equal(isHoneypotTripped("   "), false);
    assert.equal(isHoneypotTripped(undefined), false);
    assert.equal(isHoneypotTripped(null), false);
  });

  it("trips when the field has a value or a non-string payload", () => {
    assert.equal(isHoneypotTripped("https://spam.test"), true);
    assert.equal(isHoneypotTripped(["https://spam.test"]), true);
  });
});

describe("buildContactEmail", () => {
  it("escapes html in the message and keeps the sender address for the reply", () => {
    const email = buildContactEmail({
      name: "Ada <script>",
      email: "ada@example.com",
      message: "Hello <b>there</b> & friends",
    });
    assert.equal(email.subject, "Website question from Ada <script>");
    assert.match(email.html, /Ada &lt;script&gt;/);
    assert.match(email.html, /Hello &lt;b&gt;there&lt;\/b&gt; &amp; friends/);
    assert.doesNotMatch(email.html, /<script>/);
    assert.match(email.text, /ada@example.com/);
    assert.match(email.text, /Hello <b>there<\/b> & friends/);
  });
});

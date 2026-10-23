import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CAMPUS_LEAD_SUCCESS,
  isHoneypotTripped,
  isMissingLeadStore,
  validateCampusLead,
} from "./campusLead.ts";

const valid = {
  name: "Ada Example",
  email: "ada@example.com",
  phone: "",
  course: "Calculus",
  sessionFormat: "online",
  source: "tcu",
  website: "",
};

describe("validateCampusLead", () => {
  it("accepts email without a phone", () => {
    const result = validateCampusLead(valid);
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.lead.utmSource, "tcu");
    assert.equal(result.lead.utmMedium, "campus_flyer");
    assert.equal(result.lead.email, "ada@example.com");
    assert.equal(result.lead.phone, null);
    assert.equal(result.lead.sessionFormat, "online");
  });

  it("accepts a phone without an email", () => {
    const result = validateCampusLead({
      ...valid,
      email: "",
      phone: "(214) 555-0100",
      source: "smu",
      sessionFormat: "",
    });
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.lead.utmSource, "smu");
    assert.equal(result.lead.phone, "(214) 555-0100");
    assert.equal(result.lead.sessionFormat, null);
  });

  it("requires a name, a course, and at least one way to reach the person", () => {
    const result = validateCampusLead({
      ...valid,
      name: "  ",
      email: "",
      phone: "",
      course: "",
    });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.fieldErrors.name, "Enter your name.");
    assert.equal(result.fieldErrors.contact, "Enter an email or a phone number.");
    assert.equal(result.fieldErrors.course, "Enter the class you need a tutor for.");
  });

  it("rejects a bad email or a short phone when that field is filled in", () => {
    const result = validateCampusLead({ ...valid, email: "not-an-email", phone: "123" });
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.equal(result.fieldErrors.email, "Enter a valid email.");
    assert.equal(result.fieldErrors.phone, "Enter a valid phone number.");
  });
});

describe("campus lead guards", () => {
  it("keeps the public success copy exact", () => {
    assert.equal(CAMPUS_LEAD_SUCCESS, "Thanks, we will reach out soon.");
  });

  it("treats a filled honeypot as spam", () => {
    assert.equal(isHoneypotTripped(""), false);
    assert.equal(isHoneypotTripped("http://spam.test"), true);
  });

  it("recognizes a missing leads table", () => {
    assert.equal(
      isMissingLeadStore({ code: "PGRST205", message: "Could not find the table in the schema cache" }),
      true,
    );
    assert.equal(isMissingLeadStore({ code: "23514", message: "check constraint" }), false);
  });
});

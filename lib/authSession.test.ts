import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decidePortalAccess, isTransientAuthError } from "./authSession.ts";

const tutor = {
  pathname: "/portal/tutor",
  userId: "user-1",
  authError: null,
  role: "tutor",
  profileErrorCode: null,
  profileRequestFailed: false,
};

describe("isTransientAuthError", () => {
  it("treats transport failures as transient", () => {
    assert.equal(isTransientAuthError({ name: "AuthRetryableFetchError", message: "timeout" }), true);
    assert.equal(isTransientAuthError({ message: "Failed to fetch", status: 0 }), true);
    assert.equal(isTransientAuthError({ status: 503, message: "upstream unavailable" }), true);
  });

  it("does not treat a revoked refresh token as transient", () => {
    assert.equal(
      isTransientAuthError({ name: "AuthApiError", message: "Invalid Refresh Token: Already Used", status: 400 }),
      false,
    );
    assert.equal(
      isTransientAuthError({ name: "AuthApiError", message: "Invalid Refresh Token: Refresh Token Not Found", status: 400 }),
      false,
    );
    assert.equal(isTransientAuthError({ message: "Auth session missing!" }), false);
    assert.equal(isTransientAuthError(null), false);
  });
});

describe("decidePortalAccess", () => {
  it("keeps a signed-in tutor on the portal", () => {
    assert.equal(decidePortalAccess(tutor), "continue");
  });

  it("does not send a tutor to login when the auth server blips", () => {
    assert.equal(
      decidePortalAccess({
        ...tutor,
        userId: null,
        role: null,
        authError: { name: "AuthRetryableFetchError", message: "Failed to fetch" },
      }),
      "continue",
    );
  });

  it("does not sign a tutor out when the profile read fails", () => {
    assert.equal(
      decidePortalAccess({
        ...tutor,
        role: null,
        profileRequestFailed: true,
        profileErrorCode: null,
      }),
      "continue",
    );
  });

  it("sends an anonymous portal request to login", () => {
    assert.equal(
      decidePortalAccess({ ...tutor, userId: null, role: null }),
      "redirect-login",
    );
  });

  it("sends a missing profile row to login", () => {
    assert.equal(
      decidePortalAccess({
        ...tutor,
        role: null,
        profileRequestFailed: true,
        profileErrorCode: "PGRST116",
      }),
      "redirect-login",
    );
  });

  it("lets an admin open the tutor portal and blocks a student", () => {
    assert.equal(decidePortalAccess({ ...tutor, role: "admin" }), "continue");
    assert.equal(decidePortalAccess({ ...tutor, role: "student" }), "redirect-login");
  });

  it("refreshes a session on public pages without redirecting", () => {
    assert.equal(
      decidePortalAccess({ ...tutor, pathname: "/", userId: null, role: null }),
      "continue",
    );
  });
});

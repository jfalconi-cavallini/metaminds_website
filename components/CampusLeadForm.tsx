"use client";

import { useEffect, useId, useState } from "react";
import Navbar from "@/components/Navbar";
import {
  CAMPUS_LEAD_SUCCESS,
  CAMPUS_UTM_MEDIUM,
  validateCampusLead,
  type CampusLeadFieldErrors,
  type CampusSource,
} from "@/lib/campusLead";

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

const inputClass =
  "w-full min-h-[44px] px-4 rounded-xl border border-gray-200 bg-white text-[16px] text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2";

export default function CampusLeadForm({
  source,
  campusLabel,
}: {
  source: CampusSource;
  campusLabel: string;
}) {
  const baseId = useId();
  const nameId = `${baseId}-name`;
  const emailId = `${baseId}-email`;
  const phoneId = `${baseId}-phone`;
  const courseId = `${baseId}-course`;
  const websiteId = `${baseId}-website`;
  const nameErrorId = `${baseId}-name-error`;
  const emailErrorId = `${baseId}-email-error`;
  const phoneErrorId = `${baseId}-phone-error`;
  const contactErrorId = `${baseId}-contact-error`;
  const courseErrorId = `${baseId}-course-error`;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState("");
  const [sessionFormat, setSessionFormat] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<CampusLeadFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  useEffect(() => {
    const url = new URL(window.location.href);
    const hasCampaign =
      url.searchParams.get("utm_source") === source &&
      url.searchParams.get("utm_medium") === CAMPUS_UTM_MEDIUM;
    if (hasCampaign) return;
    url.searchParams.set("utm_source", source);
    url.searchParams.set("utm_medium", CAMPUS_UTM_MEDIUM);
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(null, "", next);
    (window as GtagWindow).gtag?.("event", "page_view", {
      send_to: "G-MHFJLNT58X",
      page_location: `${url.origin}${next}`,
      campaign_source: source,
      campaign_medium: CAMPUS_UTM_MEDIUM,
    });
  }, [source]);

  function clearError(field: keyof CampusLeadFieldErrors) {
    setErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }

  function focusFirstError(fieldErrors: CampusLeadFieldErrors) {
    const order: Array<[keyof CampusLeadFieldErrors, string]> = [
      ["name", nameId],
      ["contact", emailId],
      ["email", emailId],
      ["phone", phoneId],
      ["course", courseId],
    ];
    const match = order.find(([field]) => fieldErrors[field]);
    if (!match) return;
    document.getElementById(match[1])?.focus();
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (website.trim()) {
      setSucceeded(true);
      return;
    }

    const parsed = validateCampusLead({
      name,
      email,
      phone,
      course,
      sessionFormat,
      source,
      website,
    });
    if (!parsed.ok) {
      setErrors(parsed.fieldErrors);
      focusFirstError(parsed.fieldErrors);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const response = await fetch("/api/campus-leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          course,
          sessionFormat,
          source,
          website,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        error?: string;
        fieldErrors?: CampusLeadFieldErrors;
      } | null;

      if (payload?.fieldErrors) {
        setErrors(payload.fieldErrors);
        setFormError("");
        focusFirstError(payload.fieldErrors);
        return;
      }
      if (!response.ok || !payload?.ok) {
        setFormError(payload?.error || "Something went wrong. Please try again.");
        return;
      }
      setSucceeded(true);
    } catch {
      setFormError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const emailDescribedBy = [errors.email ? emailErrorId : "", errors.contact ? contactErrorId : ""]
    .filter(Boolean)
    .join(" ");
  const phoneDescribedBy = [errors.phone ? phoneErrorId : "", errors.contact ? contactErrorId : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="px-4 pt-24 pb-12">
        <div className="mx-auto w-full max-w-md">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{campusLabel}</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900">Get a tutor for your class</h1>
          <p className="mt-2 text-sm text-gray-600">Tell us the class and how to reach you.</p>

          <div aria-live="polite" aria-atomic="true">
            {succeeded ? (
              <p
                role="status"
                className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 text-base font-semibold text-gray-900 shadow-sm"
              >
                {CAMPUS_LEAD_SUCCESS}
              </p>
            ) : null}
          </div>
          {succeeded ? null : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="mt-6 space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div aria-hidden="true" style={{ display: "none" }}>
                <label htmlFor={websiteId}>Company</label>
                <input
                  id={websiteId}
                  name="mm_hp"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                />
              </div>

              <div>
                <label htmlFor={nameId} className="mb-1 block text-sm font-semibold text-gray-900">
                  Name
                </label>
                <input
                  id={nameId}
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  aria-required="true"
                  aria-invalid={errors.name ? true : undefined}
                  aria-describedby={errors.name ? nameErrorId : undefined}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                    clearError("name");
                  }}
                  className={`${inputClass} ${errors.name ? "border-red-500" : ""}`}
                />
                {errors.name ? (
                  <p id={nameErrorId} className="mt-1 text-sm text-red-600">
                    {errors.name}
                  </p>
                ) : null}
              </div>

              <fieldset className="space-y-4">
                <legend className="text-sm font-semibold text-gray-900">How should we reach you?</legend>
                <p className="text-xs text-gray-500">Email or phone is enough. You can share both.</p>
                <div>
                  <label htmlFor={emailId} className="mb-1 block text-sm font-semibold text-gray-900">
                    Email
                  </label>
                  <input
                    id={emailId}
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    aria-invalid={errors.email || errors.contact ? true : undefined}
                    aria-describedby={emailDescribedBy || undefined}
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      clearError("email");
                      clearError("contact");
                    }}
                    className={`${inputClass} ${errors.email || errors.contact ? "border-red-500" : ""}`}
                  />
                  {errors.email ? (
                    <p id={emailErrorId} className="mt-1 text-sm text-red-600">
                      {errors.email}
                    </p>
                  ) : null}
                </div>
                <div>
                  <label htmlFor={phoneId} className="mb-1 block text-sm font-semibold text-gray-900">
                    Phone
                  </label>
                  <input
                    id={phoneId}
                    name="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    aria-invalid={errors.phone || errors.contact ? true : undefined}
                    aria-describedby={phoneDescribedBy || undefined}
                    value={phone}
                    onChange={(event) => {
                      setPhone(event.target.value);
                      clearError("phone");
                      clearError("contact");
                    }}
                    className={`${inputClass} ${errors.phone || errors.contact ? "border-red-500" : ""}`}
                  />
                  {errors.phone ? (
                    <p id={phoneErrorId} className="mt-1 text-sm text-red-600">
                      {errors.phone}
                    </p>
                  ) : null}
                </div>
                {errors.contact ? (
                  <p id={contactErrorId} className="text-sm text-red-600">
                    {errors.contact}
                  </p>
                ) : null}
              </fieldset>

              <div>
                <label htmlFor={courseId} className="mb-1 block text-sm font-semibold text-gray-900">
                  Course
                </label>
                <input
                  id={courseId}
                  name="course"
                  type="text"
                  autoComplete="off"
                  required
                  aria-required="true"
                  aria-invalid={errors.course ? true : undefined}
                  aria-describedby={errors.course ? courseErrorId : undefined}
                  value={course}
                  onChange={(event) => {
                    setCourse(event.target.value);
                    clearError("course");
                  }}
                  className={`${inputClass} ${errors.course ? "border-red-500" : ""}`}
                />
                {errors.course ? (
                  <p id={courseErrorId} className="mt-1 text-sm text-red-600">
                    {errors.course}
                  </p>
                ) : null}
              </div>

              <fieldset>
                <legend className="text-sm font-semibold text-gray-900">Online or in person?</legend>
                <p className="mb-2 text-xs text-gray-500">Optional</p>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: "online", label: "Online" },
                    { value: "in_person", label: "In person" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-3 text-sm font-medium text-gray-900 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-600 has-[:focus-visible]:ring-offset-2"
                    >
                      <input
                        type="radio"
                        name="sessionFormat"
                        value={option.value}
                        checked={sessionFormat === option.value}
                        onChange={() => setSessionFormat(option.value)}
                        className="size-5 accent-blue-600"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={submitting}
                aria-busy={submitting}
                className="min-h-[44px] w-full rounded-xl bg-blue-600 text-base font-semibold text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {submitting ? "Sending" : "Send"}
              </button>

              <div aria-live="polite" aria-atomic="true">
                {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

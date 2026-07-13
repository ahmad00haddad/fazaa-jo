import { describe, it, expect } from "vitest";
import { filterActiveFeed, isFazaaExpired, type FazaaRequest } from "./fazaa";

function makeReq(overrides: Partial<FazaaRequest> = {}): FazaaRequest {
  return {
    id: overrides.id ?? crypto.randomUUID(),
    user_id: overrides.user_id ?? "owner-1",
    requester_name: "Test",
    requester_gender: "male",
    need: "need",
    category: "أخرى",
    urgency: "عادية",
    location: null,
    latitude: null,
    longitude: null,
    created_at: new Date().toISOString(),
    female_only: false,
    gender_visibility: "all",
    city: null,
    status: "active",
    requester_verified: false,
    price_jod: 0,
    ...overrides,
  };
}

describe("isFazaaExpired", () => {
  it("returns false for non-urgent requests regardless of age", () => {
    const old = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    expect(isFazaaExpired({ urgency: "عادية", created_at: old })).toBe(false);
    expect(isFazaaExpired({ urgency: "حرجة", created_at: old })).toBe(false);
  });

  it("expires 'عاجلة اليوم' after 24h", () => {
    const old = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const fresh = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    expect(isFazaaExpired({ urgency: "عاجلة اليوم", created_at: old })).toBe(true);
    expect(isFazaaExpired({ urgency: "عاجلة اليوم", created_at: fresh })).toBe(false);
  });
});

describe("filterActiveFeed", () => {
  it("removes non-active and expired requests", () => {
    const items = [
      makeReq({ id: "a", status: "active" }),
      makeReq({ id: "b", status: "completed" }),
      makeReq({ id: "c", status: "cancelled" }),
      makeReq({
        id: "d",
        status: "active",
        urgency: "عاجلة اليوم",
        created_at: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
      }),
    ];
    const out = filterActiveFeed(items);
    expect(out.map((r) => r.id)).toEqual(["a"]);
  });

  it("hides female-only requests from male viewers", () => {
    const items = [
      makeReq({ id: "pub", female_only: false, user_id: "x" }),
      makeReq({ id: "fem", female_only: true, user_id: "x" }),
    ];
    const out = filterActiveFeed(items, { viewerGender: "male", viewerId: "viewer" });
    expect(out.map((r) => r.id)).toEqual(["pub"]);
  });

  it("shows female-only requests to female viewers", () => {
    const items = [
      makeReq({ id: "pub", female_only: false, user_id: "x" }),
      makeReq({ id: "fem", female_only: true, user_id: "x" }),
    ];
    const out = filterActiveFeed(items, { viewerGender: "female", viewerId: "viewer" });
    expect(out.map((r) => r.id).sort()).toEqual(["fem", "pub"]);
  });

  it("always shows owner their own female-only request even if male", () => {
    const items = [
      makeReq({ id: "mine", female_only: true, user_id: "viewer" }),
      makeReq({ id: "other", female_only: true, user_id: "someone" }),
    ];
    const out = filterActiveFeed(items, { viewerGender: "male", viewerId: "viewer" });
    expect(out.map((r) => r.id)).toEqual(["mine"]);
  });

  it("hides female-only from anonymous/unknown gender viewers", () => {
    const items = [
      makeReq({ id: "pub" }),
      makeReq({ id: "fem", female_only: true }),
    ];
    const out = filterActiveFeed(items);
    expect(out.map((r) => r.id)).toEqual(["pub"]);
  });
});

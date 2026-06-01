import { supabase } from "@/integrations/supabase/client";
import { normalizeJordanPhone, buildJordanWhatsAppUrl } from "@/lib/phone";

export type FazaaCategory =
  | "تعطل مركبة"
  | "دواء عاجل"
  | "مشتريات ضرورية"
  | "توصيل ومشاوير"
  | "توصيل من/إلى المطار"
  | "مشوار للمستشفى"
  | "فزعة جامعية"
  | "طوارئ منزل"
  | "تعليم ودراسة"
  | "فزعة رمضان"
  | "أخرى";

export type FazaaUrgency = "حرجة" | "عاجلة اليوم" | "عادية";
export type FazaaStatus = "active" | "completed" | "cancelled";

export const JORDAN_CITIES = [
  "عمّان",
  "إربد",
  "الزرقاء",
  "العقبة",
  "السلط",
  "المفرق",
  "الكرك",
  "مأدبا",
  "جرش",
  "عجلون",
  "الطفيلة",
  "معان",
] as const;
export type JordanCity = (typeof JORDAN_CITIES)[number];

export interface FazaaRequest {
  id: string;
  user_id: string;
  requester_name: string;
  requester_gender: string;
  need: string;
  category: string;
  urgency: string;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  female_only: boolean;
  city: string | null;
  status: FazaaStatus;
  requester_verified: boolean;
  price_jod: number;
}

export interface FazaaResponse {
  id: string;
  request_id: string;
  responder_id: string;
  responder_name: string;
  message: string | null;
  accepted: boolean;
  created_at: string;
  offered_price_jod: number | null;
}

export interface NewFazaaInput {
  need: string;
  category: FazaaCategory;
  urgency: FazaaUrgency;
  location?: string;
  latitude?: number;
  longitude?: number;
  female_only?: boolean;
  city?: string | null;
  price_jod: number;
}

export const FAZAA_CATEGORIES: FazaaCategory[] = [
  "تعطل مركبة",
  "دواء عاجل",
  "مشتريات ضرورية",
  "توصيل ومشاوير",
  "توصيل من/إلى المطار",
  "مشوار للمستشفى",
  "فزعة جامعية",
  "طوارئ منزل",
  "تعليم ودراسة",
  "فزعة رمضان",
  "أخرى",
];

export const FAZAA_URGENCY_OPTIONS: FazaaUrgency[] = ["حرجة", "عاجلة اليوم", "عادية"];

// "عاجلة اليوم" تنتهي تلقائياً بعد 24 ساعة من النشر
export function isFazaaExpired(req: Pick<FazaaRequest, "urgency" | "created_at">): boolean {
  if (req.urgency !== "عاجلة اليوم") return false;
  const ageMs = Date.now() - new Date(req.created_at).getTime();
  return ageMs > 24 * 60 * 60 * 1000;
}

export function filterActiveFeed(items: FazaaRequest[]): FazaaRequest[] {
  return items.filter((r) => r.status === "active" && !isFazaaExpired(r));
}

export async function fetchFeed(): Promise<FazaaRequest[]> {
  const { data, error } = await supabase
    .from("fazaa_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FazaaRequest[];
}

// ---------- AI category/urgency suggestion ----------
export interface FazaaSuggestion {
  category: FazaaCategory;
  urgency: FazaaUrgency;
}

export async function suggestFazaaTags(need: string): Promise<FazaaSuggestion | null> {
  if (!need || need.trim().length < 5) return null;
  const system = `أنت مصنّف لطلبات مساعدة مجتمعية في الأردن (تطبيق "فزعة").
- صنّف الطلب إلى فئة واحدة من: ${FAZAA_CATEGORIES.join("، ")}.
- صنّف درجة الاستعجال إلى واحدة من: حرجة، عاجلة اليوم، عادية.
- "حرجة" = خطر على حياة أو صحة فورية (نزيف، حادث، مريض حرج، حريق).
- "عاجلة اليوم" = يحتاج خلال ساعات (دواء اليوم، توصيل لمطار قريب، تعطل سيارة).
- "عادية" = يمكن تأجيله أيام (مشتريات، مساعدة دراسية، خدمة غير طارئة) — هذا هو الافتراضي إذا لم يكن واضحاً.
أعِد JSON فقط بهذا الشكل بدون أي شرح:
{"category":"...","urgency":"..."}`;
  try {
    const { data, error } = await supabase.functions.invoke("ai", {
      body: { system, prompt: need.trim() },
    });
    if (error || !data?.text) return null;
    const raw = String(data.text).trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) return null;
    const parsed = JSON.parse(match[0]) as Partial<FazaaSuggestion>;
    if (!parsed.category || !parsed.urgency) return null;
    const category = (FAZAA_CATEGORIES as readonly string[]).includes(parsed.category)
      ? (parsed.category as FazaaCategory)
      : "أخرى";
    const urgency = (FAZAA_URGENCY_OPTIONS as readonly string[]).includes(parsed.urgency)
      ? (parsed.urgency as FazaaUrgency)
      : "عادية";
    return { category, urgency };
  } catch {
    return null;
  }
}

// ---------- Avatar upload (compressed client-side) ----------
async function compressImage(file: File, maxDim = 400, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("compression failed"))), "image/jpeg", quality);
  });
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const blob = await compressImage(file, 400, 0.82);
  const path = `${userId}/avatar.jpg`;
  const { error: upErr } = await supabase.storage
    .from("avatars")
    .upload(path, blob, { upsert: true, contentType: "image/jpeg", cacheControl: "3600" });
  if (upErr) throw upErr;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${data.publicUrl}?v=${Date.now()}`; // cache-bust
  const { error: profErr } = await supabase
    .from("profiles")
    .update({ avatar_url: url })
    .eq("id", userId);
  if (profErr) throw profErr;
  return url;
}


export async function createRequest(
  userId: string,
  name: string,
  gender: string,
  input: NewFazaaInput,
): Promise<FazaaRequest> {
  const { data, error } = await supabase
    .from("fazaa_requests")
    .insert({
      user_id: userId,
      requester_name: name,
      requester_gender: gender,
      need: input.need,
      category: input.category,
      urgency: input.urgency,
      location: input.location ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      female_only: !!input.female_only,
      city: input.city ?? null,
      price_jod: input.price_jod ?? 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data as FazaaRequest;
}

export async function deleteRequest(id: string) {
  const { error } = await supabase.from("fazaa_requests").delete().eq("id", id);
  if (error) throw error;
}

export async function updateRequestStatus(id: string, status: FazaaStatus) {
  const { error } = await supabase.from("fazaa_requests").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function offerHelp(
  requestId: string,
  responderId: string,
  responderName: string,
  message?: string,
  offeredPriceJod?: number | null,
) {
  const { error } = await supabase.from("fazaa_responses").insert({
    request_id: requestId,
    responder_id: responderId,
    responder_name: responderName,
    message: message ?? null,
    offered_price_jod: offeredPriceJod ?? null,
  });
  if (error) throw error;
}

export async function fetchResponsesForRequest(requestId: string): Promise<FazaaResponse[]> {
  const { data, error } = await supabase
    .from("fazaa_responses")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FazaaResponse[];
}

export async function fetchMyResponses(userId: string) {
  const { data, error } = await supabase
    .from("fazaa_responses")
    .select("*, fazaa_requests(*)")
    .eq("responder_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function acceptResponse(responseId: string) {
  const { error } = await supabase
    .from("fazaa_responses")
    .update({ accepted: true })
    .eq("id", responseId);
  if (error) throw error;
}

export async function declineResponse(responseId: string) {
  const { error } = await supabase.from("fazaa_responses").delete().eq("id", responseId);
  if (error) throw error;
}

export async function fetchResponderPhone(responderId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("phone, name")
    .eq("id", responderId)
    .maybeSingle();
  if (error) return null;
  return data?.phone ?? null;
}

// ---------- Area Watch ----------
export interface AreaWatcher {
  id: string;
  user_id: string;
  user_name: string;
  city: string;
  created_at: string;
  expires_at: string;
}

export async function startAreaWatch(userId: string, userName: string, city: string) {
  // Remove any previous active watch for this user
  await supabase.from("area_watch").delete().eq("user_id", userId);
  const { data, error } = await supabase
    .from("area_watch")
    .insert({ user_id: userId, user_name: userName, city })
    .select()
    .single();
  if (error) throw error;
  return data as AreaWatcher;
}

export async function stopAreaWatch(userId: string) {
  const { error } = await supabase.from("area_watch").delete().eq("user_id", userId);
  if (error) throw error;
}

export async function fetchActiveWatchers(): Promise<AreaWatcher[]> {
  const { data, error } = await supabase
    .from("area_watch")
    .select("*")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as AreaWatcher[];
}

export async function fetchMyActiveWatch(userId: string): Promise<AreaWatcher | null> {
  const { data } = await supabase
    .from("area_watch")
    .select("*")
    .eq("user_id", userId)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  return (data as AreaWatcher) ?? null;
}

// ---------- Stats ----------
export interface JordanStats {
  activeNow: number;
  completedWeek: number;
  topCity: { city: string; count: number } | null;
  watchersNow: number;
}

export async function fetchJordanStats(): Promise<JordanStats> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const [active, completed, watchers, byCity] = await Promise.all([
    supabase.from("fazaa_requests").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("fazaa_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("created_at", weekAgo),
    supabase
      .from("area_watch")
      .select("id", { count: "exact", head: true })
      .gt("expires_at", new Date().toISOString()),
    supabase.from("fazaa_requests").select("city").eq("status", "active").not("city", "is", null),
  ]);

  let topCity: JordanStats["topCity"] = null;
  if (byCity.data && byCity.data.length) {
    const counts: Record<string, number> = {};
    for (const r of byCity.data as { city: string | null }[]) {
      if (!r.city) continue;
      counts[r.city] = (counts[r.city] ?? 0) + 1;
    }
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    if (top) topCity = { city: top[0], count: top[1] };
  }

  return {
    activeNow: active.count ?? 0,
    completedWeek: completed.count ?? 0,
    topCity,
    watchersNow: watchers.count ?? 0,
  };
}

export async function markSelfVerified(): Promise<boolean> {
  const { data, error } = await supabase.rpc("mark_self_verified");
  if (error) throw error;
  return !!data;
}

export function formatTimeAgo(iso: string) {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `قبل ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `قبل ${hours} ساعة`;
  return `قبل ${Math.floor(hours / 24)} يوم`;
}

export function buildWhatsAppUrl(phone: string, message?: string) {
  return buildJordanWhatsAppUrl(phone, message);
}

// ---------- Leaderboard ----------
export interface LeaderRow {
  user_id: string;
  name: string;
  city: string | null;
  completed_count: number;
  verified: boolean;
}

export async function fetchWeeklyLeaderboard(limit = 10): Promise<LeaderRow[]> {
  const { data, error } = await supabase.rpc("weekly_leaderboard", { _limit: limit });
  if (error) throw error;
  return ((data ?? []) as any[]).map((r) => ({
    user_id: r.user_id,
    name: r.name,
    city: r.city,
    completed_count: Number(r.completed_count ?? 0),
    verified: !!r.verified,
  }));
}

export async function fetchMonthlyTopHelper(): Promise<{ user_id: string; name: string; city: string | null; completed_count: number } | null> {
  const { data, error } = await supabase.rpc("monthly_top_helper");
  if (error) throw error;
  const arr = (data ?? []) as any[];
  if (!arr.length) return null;
  const r = arr[0];
  return {
    user_id: r.user_id,
    name: r.name,
    city: r.city,
    completed_count: Number(r.completed_count ?? 0),
  };
}

export async function fetchUserCompletedCount(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc("user_completed_count", { _user_id: userId });
  if (error) return 0;
  return Number(data ?? 0);
}

export const VERIFIED_HELPER_THRESHOLD = 5;

// ---------- Phone verification (WhatsApp self-send) ----------
export async function createPhoneVerification(userId: string, phone: string, code: string) {
  await supabase.from("phone_verifications").delete().eq("user_id", userId);
  const { error } = await supabase
    .from("phone_verifications")
    .insert({ user_id: userId, phone, code });
  if (error) throw error;
}

export async function confirmPhoneVerification(userId: string, phone: string, code: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("phone_verifications")
    .select("id, code, phone, expires_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data) return false;
  if (data.phone !== phone) return false;
  if (new Date(data.expires_at).getTime() < Date.now()) return false;
  if (data.code !== code.trim()) return false;
  await supabase.from("profiles").update({ phone_verified: true }).eq("id", userId);
  await supabase.from("phone_verifications").delete().eq("user_id", userId);
  return true;
}

export function buildMapsUrl(req: FazaaRequest) {
  if (typeof req.latitude === "number" && typeof req.longitude === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${req.latitude},${req.longitude}`;
  }
  if (req.location) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(req.location)}`;
  }
  return "";
}

export function urgencyVariant(urgency: string) {
  if (urgency === "حرجة") return "primary" as const;
  if (urgency === "عاجلة اليوم") return "accent" as const;
  return "secondary" as const;
}

// Haversine distance in km
export function distanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

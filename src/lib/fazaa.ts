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
}

export interface FazaaResponse {
  id: string;
  request_id: string;
  responder_id: string;
  responder_name: string;
  message: string | null;
  accepted: boolean;
  created_at: string;
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

export async function fetchFeed(): Promise<FazaaRequest[]> {
  const { data, error } = await supabase
    .from("fazaa_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FazaaRequest[];
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
) {
  const { error } = await supabase.from("fazaa_responses").insert({
    request_id: requestId,
    responder_id: responderId,
    responder_name: responderName,
    message: message ?? null,
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
  const normalized = phone.replace(/\D/g, "").replace(/^0/, "962");
  const text = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${normalized}${text}`;
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

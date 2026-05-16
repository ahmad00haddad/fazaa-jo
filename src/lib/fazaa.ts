import { supabase } from "@/integrations/supabase/client";

export type FazaaCategory =
  | "تعطل مركبة"
  | "دواء عاجل"
  | "مشتريات ضرورية"
  | "توصيل ومشاوير"
  | "تعليم"
  | "أخرى";
export type FazaaUrgency = "حرجة" | "عاجلة اليوم" | "عادية";

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
}

export const FAZAA_CATEGORIES: FazaaCategory[] = [
  "تعطل مركبة",
  "دواء عاجل",
  "مشتريات ضرورية",
  "توصيل ومشاوير",
  "تعليم",
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

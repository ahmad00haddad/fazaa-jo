export type FazaaCategory = "تعطل مركبة" | "دواء عاجل" | "مشتريات ضرورية" | "توصيل ومشاوير" | "تعليم" | "أخرى";
export type FazaaUrgency = "حرجة" | "عاجلة اليوم" | "عادية";

export interface FazaaRequest {
  id: string;
  name: string;
  phone: string;
  need: string;
  category: FazaaCategory;
  urgency: FazaaUrgency;
  location?: string;
  latitude?: number;
  longitude?: number;
  createdAt: number;
  mine?: boolean;
}

export interface NewFazaaRequest {
  name: string;
  phone: string;
  need: string;
  category: FazaaCategory;
  urgency: FazaaUrgency;
  location?: string;
  latitude?: number;
  longitude?: number;
}

export const FAZAA_STORAGE_KEY = "fazaa_my_requests_v2";

export const FAZAA_CATEGORIES: FazaaCategory[] = [
  "تعطل مركبة",
  "دواء عاجل",
  "مشتريات ضرورية",
  "توصيل ومشاوير",
  "تعليم",
  "أخرى",
];

export const FAZAA_URGENCY_OPTIONS: FazaaUrgency[] = ["حرجة", "عاجلة اليوم", "عادية"];

export const SEED_REQUESTS: FazaaRequest[] = [
  {
    id: "seed-1",
    name: "أحمد",
    phone: "0791234567",
    need: "السيارة تعطلت قرب شارع المطار وأحتاج شخص يساعدني أو يدلني على ونش قريب.",
    category: "تعطل مركبة",
    urgency: "حرجة",
    location: "عمّان - شارع المطار",
    createdAt: Date.now() - 1000 * 60 * 12,
  },
  {
    id: "seed-2",
    name: "سارة",
    phone: "0782345678",
    need: "أحتاج إحضار دواء حرارة لطفل بشكل عاجل من أقرب صيدلية مفتوحة.",
    category: "دواء عاجل",
    urgency: "حرجة",
    location: "الزرقاء - حي رمزي",
    createdAt: Date.now() - 1000 * 60 * 27,
  },
  {
    id: "seed-3",
    name: "محمد",
    phone: "0773456789",
    need: "محتاج آلة حاسبة علمية الليلة لامتحان الجامعة صباحاً.",
    category: "تعليم",
    urgency: "عاجلة اليوم",
    location: "إربد - شارع الجامعة",
    createdAt: Date.now() - 1000 * 60 * 49,
  },
  {
    id: "seed-4",
    name: "ليان",
    phone: "0794567890",
    need: "أحتاج من يوصلني إلى المستشفى أو يؤمن لي مشوار سريع خلال نصف ساعة.",
    category: "توصيل ومشاوير",
    urgency: "حرجة",
    location: "عمّان - الجبيهة",
    createdAt: Date.now() - 1000 * 60 * 70,
  },
];

function isBrowser() {
  return typeof window !== "undefined";
}

export function loadMyFazaaRequests(): FazaaRequest[] {
  if (!isBrowser()) return [];

  try {
    const raw = window.localStorage.getItem(FAZAA_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as FazaaRequest[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveMyFazaaRequests(requests: FazaaRequest[]) {
  if (!isBrowser()) return;
  window.localStorage.setItem(FAZAA_STORAGE_KEY, JSON.stringify(requests));
}

export function loadFazaaFeed() {
  const mine = loadMyFazaaRequests();
  const merged = [...mine, ...SEED_REQUESTS].sort((a, b) => b.createdAt - a.createdAt);
  return merged;
}

export function createFazaaRequest(input: NewFazaaRequest): FazaaRequest {
  const next: FazaaRequest = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    mine: true,
  };

  const mine = [next, ...loadMyFazaaRequests()].sort((a, b) => b.createdAt - a.createdAt);
  saveMyFazaaRequests(mine);
  return next;
}

export function deleteMyFazaaRequest(id: string) {
  const next = loadMyFazaaRequests().filter((item) => item.id !== id);
  saveMyFazaaRequests(next);
}

export function formatTimeAgo(timestamp: number) {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
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

export function buildMapsUrl(request: FazaaRequest) {
  if (typeof request.latitude === "number" && typeof request.longitude === "number") {
    return `https://www.google.com/maps/search/?api=1&query=${request.latitude},${request.longitude}`;
  }

  if (request.location) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(request.location)}`;
  }

  return "";
}

export function urgencyVariant(urgency: FazaaUrgency) {
  if (urgency === "حرجة") return "primary" as const;
  if (urgency === "عاجلة اليوم") return "accent" as const;
  return "secondary" as const;
}

import { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { Plus, Filter, X } from "lucide-react";
import { toast } from "sonner";
import { Drawer } from "vaul";
import { useAuth } from "@/contexts/AuthContext";
import {
  acceptResponse,
  confirmFazaaCompletion,
  createRequest,
  declineResponse,
  deleteRequest,
  fetchFeed,
  fetchResponsesForRequest,
  offerHelp,
  updateRequestStatus,
  isFazaaExpired,
  submitRating,
  FAZAA_CATEGORIES,
  FAZAA_URGENCY_OPTIONS,
  type NewFazaaInput,
  type FazaaRequest,
  type FazaaResponse
} from "@/lib/fazaa";
import { useRealtimeFazaa } from "@/hooks/useRealtimeFazaa";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { OtherRequestCard } from "@/components/fazaa/OtherRequestCard";
import { MyRequestCard } from "@/components/fazaa/MyRequestCard";
import { RequestComposer } from "@/components/fazaa/RequestComposer";
import { RatingModal } from "@/components/fazaa/RatingModal";
import FazaaMap from "@/components/fazaa/FazaaMap";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";

export default function Fazaa() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [showComposer, setShowComposer] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [openResponses, setOpenResponses] = useState<string | null>(null);
  const [ratingRequest, setRatingRequest] = useState<{ reqId: string; responderId: string; responderName: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; id: string; type: "cancel" | "delete" } | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("list"); // Changed default to list for better UX

  // Filters state
  const [filterCategory, setFilterCategory] = useState<string>("الكل");
  const [filterUrgency, setFilterUrgency] = useState<string>("الكل");

  const { data: feed = [], isLoading } = useQuery({
    queryKey: ['fazaa_feed'],
    queryFn: fetchFeed,
  });

  useRealtimeFazaa();

  const visibleItems = useMemo(() => {
    return feed.filter((r) => {
      // 1. Ownership & Expiration logic
      if (r.user_id === user?.id) {
        if (r.status !== "active" && r.status !== "in_progress") return false;
      } else {
        if (isFazaaExpired(r)) return false;
        if (r.status !== "active") return false;
        // Gender visibility: respect both legacy female_only boolean AND gender_visibility enum
        const isFemaleOnly = r.female_only || (r as any).gender_visibility === "female_only";
        const isMaleOnly = (r as any).gender_visibility === "male_only";
        if (isFemaleOnly && profile?.gender !== "female") return false;
        if (isMaleOnly && profile?.gender !== "male") return false;
      }

      // 2. Filters Logic
      if (filterCategory !== "الكل" && r.category !== filterCategory) return false;
      if (filterUrgency !== "الكل" && r.urgency !== filterUrgency) return false;

      return true;
    });
  }, [feed, user?.id, profile?.gender, filterCategory, filterUrgency]);

  const myItems = useMemo(() => visibleItems.filter((i) => i.user_id === user?.id), [visibleItems, user?.id]);
  const otherItems = useMemo(() => visibleItems.filter((i) => i.user_id !== user?.id), [visibleItems, user?.id]);

  const { data: responsesByRequest = {} } = useQuery({
    queryKey: ['fazaa_responses_all', myItems.map(m => m.id).join(',')],
    queryFn: async () => {
      const map: Record<string, FazaaResponse[]> = {};
      for (const req of myItems) {
        map[req.id] = await fetchResponsesForRequest(req.id);
      }
      return map;
    },
    enabled: myItems.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: (payload: NewFazaaInput) => {
      if (!user || !profile) throw new Error("Not authenticated");
      return createRequest(user.id, profile.name, profile.gender, payload);
    },
    onMutate: async (payload: NewFazaaInput) => {
      await queryClient.cancelQueries({ queryKey: ['fazaa_feed'] });
      const previousFeed = queryClient.getQueryData(['fazaa_feed']);
      
      const optimisticFazaa: FazaaRequest = {
        id: `temp-${Date.now()}`,
        user_id: user!.id,
        requester_name: profile!.name,
        requester_gender: profile!.gender,
        need: payload.need,
        category: payload.category,
        urgency: payload.urgency,
        location: payload.location ?? null,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
        created_at: new Date().toISOString(),
        female_only: payload.gender_visibility === "female_only" || !!payload.female_only,
        gender_visibility: payload.gender_visibility ?? "all",
        city: payload.city ?? null,
        status: "active",
        requester_verified: profile?.phone_verified ?? false,
        price_jod: payload.price_jod ?? 0,
      };

      queryClient.setQueryData(['fazaa_feed'], (old: any) => {
        return [optimisticFazaa, ...(old || [])];
      });

      setShowComposer(false);
      return { previousFeed };
    },
    onError: (err, newFazaa, context) => {
      queryClient.setQueryData(['fazaa_feed'], context?.previousFeed);
      toast.error(err?.message ?? "تعذر النشر");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['fazaa_feed'] });
    },
    onSuccess: () => {
      toast.success("تم نشر طلب الفزعة");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRequest,
    onSuccess: () => {
      toast.success("تم الحذف");
      queryClient.invalidateQueries({ queryKey: ['fazaa_feed'] });
    },
    onError: (e: any) => toast.error(e?.message ?? "تعذر الحذف")
  });

  const completeMutation = useMutation({
    mutationFn: (id: string) => confirmFazaaCompletion(id),
    onSuccess: () => {
      toast.success("تم إغلاق الفزعة بنجاح، شكراً للمتعاونين");
      queryClient.invalidateQueries({ queryKey: ['fazaa_feed'] });
    },
    onError: (e: any) => toast.error(e?.message ?? "تعذر الإغلاق")
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => updateRequestStatus(id, "cancelled"),
    onSuccess: () => {
      toast.success("تم إلغاء الفزعة");
      queryClient.invalidateQueries({ queryKey: ['fazaa_feed'] });
    },
    onError: (e: any) => toast.error(e?.message ?? "تعذر الإلغاء")
  });

  const submitRatingMutation = useMutation({
    mutationFn: async (rating: number) => {
      if (!ratingRequest) return;
      await completeMutation.mutateAsync(ratingRequest.reqId);
      if (rating > 0) {
        await submitRating(ratingRequest.reqId, ratingRequest.responderId, rating).catch(() => {});
      }
    },
    onSuccess: () => {
      toast.success("تم إغلاق الفزعة، شكراً لك!");
      setRatingRequest(null);
      queryClient.invalidateQueries({ queryKey: ['fazaa_feed'] });
    }
  });

  const offerMutation = useMutation({
    mutationFn: async ({ req, price }: { req: FazaaRequest; price: number | null }) => {
      if (!user || !profile) throw new Error("Not authenticated");
      if (req.user_id === user.id) throw new Error("لا يمكنك التطوع لفزعتك الخاصة");
      const isFemaleOnly = req.female_only || (req as any).gender_visibility === "female_only";
      const isMaleOnly = (req as any).gender_visibility === "male_only";
      if (isFemaleOnly && profile.gender !== "female") throw new Error("هذه الفزعة للبنات فقط");
      if (isMaleOnly && profile.gender !== "male") throw new Error("هذه الفزعة للشباب فقط");
      const msg = price !== null && price !== Number(req.price_jod)
        ? `أنا جاهز للمساعدة. أقترح سعر ${price} د.أ`
        : "أنا جاهز للمساعدة";
      return offerHelp(req.id, req.user_id, user.id, profile.name, msg, price);
    },
    onSuccess: () => toast.success("تم إرسال استجابتك. سيتواصل معك صاحب الفزعة إذا قبل"),
    onError: (e: any) => {
      if (e?.code === "23505") toast.info("سبق وأرسلت استجابة لهذا الطلب");
      else toast.error(e?.message ?? "تعذر إرسال الاستجابة");
    }
  });

  const acceptMutation = useMutation({
    mutationFn: ({ rid, reqId, respId }: { rid: string; reqId: string; respId: string }) =>
      acceptResponse(rid, reqId, respId),
    onSuccess: () => {
      toast.success("تم قبول الاستجابة، الفزعة الآن قيد التنفيذ. تواصل معه الآن");
      queryClient.invalidateQueries({ queryKey: ['fazaa_responses_all'] });
      queryClient.invalidateQueries({ queryKey: ['fazaa_feed'] });
    },
    onError: (e: any) => toast.error(e?.message ?? "تعذر القبول")
  });

  const declineMutation = useMutation({
    mutationFn: declineResponse,
    onSuccess: () => {
      toast.success("تم رفض الاستجابة");
      queryClient.invalidateQueries({ queryKey: ['fazaa_responses_all'] });
    }
  });

  const handleDelete = (id: string, status: string) => {
    if (status === "in_progress") {
      setConfirmDialog({ isOpen: true, id, type: "cancel" });
    } else {
      setConfirmDialog({ isOpen: true, id, type: "delete" });
    }
  };

  return (
    <div className="min-h-screen pb-32 animate-fade-in">
      <PageHeader title="الطلبات النشطة" subtitle="مجتمع الفزعة" back={false} />

      <div className="p-4 space-y-4">
        {/* Actions & Filters Bar */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              if (!profile?.phone_verified) {
                toast.error("عذراً، يجب توثيق رقم هاتفك أولاً في صفحة (حسابي).", { duration: 5000 });
                return;
              }
              setShowComposer(true);
            }}
            className="flex-1 bg-primary text-primary-foreground py-3 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Plus className="w-5 h-5" />
            طلب فزعة
          </button>

          <button
            type="button"
            onClick={() => setShowFilters(true)}
            className="w-12 h-12 bg-secondary text-foreground flex items-center justify-center rounded-2xl active:scale-95 transition-transform relative"
          >
            <Filter className="w-5 h-5" />
            {(filterCategory !== "الكل" || filterUrgency !== "الكل") && (
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
            )}
          </button>
        </div>

        <div className="flex justify-center bg-secondary p-1 rounded-xl mb-4">
          <button
            onClick={() => setViewMode("list")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${viewMode === "list" ? "bg-background shadow-soft text-foreground" : "text-muted-foreground"}`}
          >
            القائمة
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-colors ${viewMode === "map" ? "bg-background shadow-soft text-foreground" : "text-muted-foreground"}`}
          >
            الخريطة
          </button>
        </div>

        {viewMode === "map" && (
          <div className="-mx-4 -mb-32 overflow-hidden rounded-t-3xl shadow-inner border-t border-border/50">
            <FazaaMap />
          </div>
        )}

        {viewMode === "list" && isLoading && (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-border bg-card p-4 animate-pulse">
                <div className="flex gap-2 mb-3">
                  <div className="h-4 w-24 rounded bg-muted" />
                  <div className="h-4 w-16 rounded bg-muted" />
                </div>
                <div className="h-3 w-full rounded bg-muted mb-2" />
                <div className="h-3 w-3/4 rounded bg-muted" />
                <div className="mt-4 h-10 w-full rounded-xl bg-muted" />
              </div>
            ))}
          </div>
        )}

        {viewMode === "list" && !isLoading && myItems.length > 0 && (
          <section className="space-y-3 mb-6">
            <h3 className="font-display font-bold text-sm px-1 text-primary">طلباتي ({myItems.length})</h3>
            {myItems.map((item) => {
              const responses = responsesByRequest[item.id] ?? [];
              const accepted = responses.find(r => r.accepted);

              return (
                <MyRequestCard
                  key={item.id}
                  item={item}
                  responses={responses}
                  open={openResponses === item.id}
                  onToggle={() => setOpenResponses((x) => (x === item.id ? null : item.id))}
                  onDelete={() => handleDelete(item.id, item.status)}
                  onComplete={() => accepted ? setRatingRequest({ reqId: item.id, responderId: accepted.responder_id, responderName: accepted.responder_name }) : completeMutation.mutate(item.id)}
                  onAccept={(rid, responderId) => acceptMutation.mutate({ rid, reqId: item.id, respId: responderId })}
                  onDecline={(rid) => declineMutation.mutate(rid)}
                />
              );
            })}
          </section>
        )}

        {viewMode === "list" && !isLoading && (
          <section className="space-y-3">
            {otherItems.length > 0 && <h3 className="font-display font-bold text-sm px-1">طلب فزعة</h3>}
            {otherItems.length === 0 && (
              <EmptyState 
                icon={Filter}
                title="لا توجد طلبات"
                description="لا توجد طلبات فزعة تطابق الفلتر الحالي."
                action={
                  (filterCategory !== "الكل" || filterUrgency !== "الكل") ? (
                    <button onClick={() => { setFilterCategory("الكل"); setFilterUrgency("الكل"); }} className="text-primary text-sm font-bold">مسح الفلاتر</button>
                  ) : undefined
                }
              />
            )}
            {otherItems.map((item) => (
              <OtherRequestCard key={item.id} item={item} onOffer={(price) => offerMutation.mutate({ req: item, price })} />
            ))}
          </section>
        )}
      </div>

      {/* Filter Drawer */}
      <Drawer.Root open={showFilters} onOpenChange={setShowFilters}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Drawer.Content className="bg-background flex flex-col rounded-t-[32px] mt-24 fixed bottom-0 left-0 right-0 z-50 max-h-[90vh]">
            <div className="p-4 bg-background rounded-t-[32px] flex-1 overflow-y-auto no-scrollbar pb-8">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-6" />
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold">تصفية الطلبات</h2>
                <button onClick={() => setShowFilters(false)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold block mb-3">الاستعجال</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilterUrgency("الكل")}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${filterUrgency === "الكل" ? "bg-primary text-white" : "bg-secondary text-foreground"}`}
                    >الكل</button>
                    {FAZAA_URGENCY_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setFilterUrgency(opt)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${filterUrgency === opt ? "bg-primary text-white" : "bg-secondary text-foreground"}`}
                      >{opt}</button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold block mb-3">الفئة</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilterCategory("الكل")}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${filterCategory === "الكل" ? "bg-primary text-white" : "bg-secondary text-foreground"}`}
                    >الكل</button>
                    {FAZAA_CATEGORIES.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setFilterCategory(opt)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${filterCategory === opt ? "bg-primary text-white" : "bg-secondary text-foreground"}`}
                      >{opt}</button>
                    ))}
                  </div>
                </div>
                
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-full mt-4 bg-primary text-white py-3.5 rounded-2xl font-bold"
                >
                  تطبيق الفلتر
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {showComposer && <RequestComposer onClose={() => setShowComposer(false)} onSubmit={(payload) => createMutation.mutate(payload)} />}

      <RatingModal
        isOpen={!!ratingRequest}
        responderName={ratingRequest?.responderName || ""}
        loading={submitRatingMutation.isPending}
        onClose={() => setRatingRequest(null)}
        onSubmit={(rating) => submitRatingMutation.mutate(rating)}
      />

      <ConfirmDialog
        isOpen={confirmDialog?.isOpen ?? false}
        onClose={() => setConfirmDialog(null)}
        onConfirm={() => {
          if (!confirmDialog) return;
          if (confirmDialog.type === "cancel") {
            cancelMutation.mutate(confirmDialog.id);
          } else {
            deleteMutation.mutate(confirmDialog.id);
          }
          setConfirmDialog(null);
        }}
        title={confirmDialog?.type === "cancel" ? "إلغاء الفزعة" : "حذف الفزعة"}
        description={
          confirmDialog?.type === "cancel"
            ? "الفزعة قيد التنفيذ حالياً، هل أنت متأكد من رغبتك في إلغائها؟"
            : "هل أنت متأكد من رغبتك في حذف طلب الفزعة؟ لا يمكن التراجع عن هذا الإجراء."
        }
        confirmText={confirmDialog?.type === "cancel" ? "إلغاء الفزعة" : "حذف"}
        isDestructive={true}
        isLoading={confirmDialog?.type === "cancel" ? cancelMutation.isPending : deleteMutation.isPending}
      />
    </div>
  );
}

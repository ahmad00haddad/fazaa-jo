import { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";
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
  type NewFazaaInput,
  type FazaaRequest,
  type FazaaResponse
} from "@/lib/fazaa";
import { useRealtimeFazaa } from "@/hooks/useRealtimeFazaa";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { OtherRequestCard } from "@/components/fazaa/OtherRequestCard";
import { MyRequestCard } from "@/components/fazaa/MyRequestCard";
import { RequestComposer } from "@/components/fazaa/RequestComposer";
import FazaaMap from "@/components/fazaa/FazaaMap";

export default function Fazaa() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [showComposer, setShowComposer] = useState(false);
  const [openResponses, setOpenResponses] = useState<string | null>(null);
  const [ratingRequest, setRatingRequest] = useState<{ reqId: string; responderId: string; responderName: string } | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");

  const { data: feed = [], isLoading } = useQuery({
    queryKey: ['fazaa_feed'],
    queryFn: fetchFeed,
  });

  useRealtimeFazaa();

  const visibleItems = useMemo(() => {
    return feed.filter((r) => {
      if (r.user_id === user?.id) {
        // Owner sees own active + in_progress items
        return r.status === "active" || r.status === "in_progress";
      }
      if (isFazaaExpired(r)) return false;
      if (r.status !== "active") return false;
      // Female-only privacy: hide from males (and unknown gender). "هذه الفزعة للبنات فقط حفاظاً على الخصوصية"
      if (r.female_only && profile?.gender !== "female") return false;
      return true;
    });
  }, [feed, user?.id, profile?.gender]);

  const myItems = useMemo(() => visibleItems.filter((i) => i.user_id === user?.id), [visibleItems, user?.id]);
  const otherItems = useMemo(() => visibleItems.filter((i) => i.user_id !== user?.id), [visibleItems, user?.id]);

  const { data: responsesByRequest = {} } = useQuery({
    queryKey: ['fazaa_responses_all', myItems.map(m => m.id)],
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
      // Complete the request first (atomic RPC), then rate
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
      if (req.female_only && profile.gender !== "female") throw new Error("هذه الفزعة للبنات فقط");
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
      if (confirm("الفزعة قيد التنفيذ — هل تريد إلغاءها؟")) cancelMutation.mutate(id);
    } else {
      if (confirm("حذف هذا الطلب؟")) deleteMutation.mutate(id);
    }
  };

  return (
    <div className="min-h-screen pb-32 animate-fade-in">
      <PageHeader title="فزعة المجتمع" subtitle="طلبات مباشرة قابلة للتنفيذ" back={false} />

      <div className="p-4 space-y-4">
        <section className="rounded-3xl gradient-hero p-4 text-primary-foreground shadow-elevated">
          <h2 className="font-display text-xl font-extrabold">إذا كنت بحاجة إلى مساعدة الآن</h2>
          <p className="text-sm opacity-90 mt-2 leading-6">
            اكتب حاجتك، وستظهر مباشرة. رقمك يبقى مخفياً، أنت من يبدأ التواصل مع من يقبل المساعدة.
          </p>
          <button
            type="button"
            onClick={() => {
              if (!profile?.phone_verified) {
                toast.error("عذراً، يجب توثيق رقم هاتفك أولاً في صفحة (حسابي) لتتمكن من إنشاء فزعة.", { duration: 5000 });
                return;
              }
              setShowComposer(true);
            }}
            className="mt-4 w-full rounded-2xl bg-white/15 py-3 font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition"
          >
            <Plus className="w-5 h-5" />
            اطلب فزعة الآن
          </button>
        </section>

        <div className="flex justify-center bg-zinc-200/50 p-1 rounded-xl mb-2">
          <button
            onClick={() => setViewMode("map")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${viewMode === "map" ? "bg-white shadow text-primary" : "text-zinc-500"}`}
          >
            الخريطة الحية
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition ${viewMode === "list" ? "bg-white shadow text-primary" : "text-zinc-500"}`}
          >
            القائمة
          </button>
        </div>

        {viewMode === "map" && (
          <div className="-mx-4 -mb-32 overflow-hidden rounded-t-3xl shadow-inner border-t border-zinc-200/50">
            <FazaaMap />
          </div>
        )}

        {viewMode === "list" && isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}

        {viewMode === "list" && !isLoading && myItems.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-display font-bold text-sm px-1">طلباتي ({myItems.length})</h3>
            {myItems.map((item) => {
              const responses = responsesByRequest[item.id] ?? [];
              const accepted = responses.find(r => r.accepted);

              const handleCompleteClick = () => {
                if (accepted) {
                  setRatingRequest({
                    reqId: item.id,
                    responderId: accepted.responder_id,
                    responderName: accepted.responder_name
                  });
                } else {
                  completeMutation.mutate(item.id);
                }
              };

              return (
                <MyRequestCard
                  key={item.id}
                  item={item}
                  responses={responses}
                  open={openResponses === item.id}
                  onToggle={() => setOpenResponses((x) => (x === item.id ? null : item.id))}
                  onDelete={() => handleDelete(item.id, item.status)}
                  onComplete={handleCompleteClick}
                  onAccept={(rid, responderId) => acceptMutation.mutate({ rid, reqId: item.id, respId: responderId })}
                  onDecline={(rid) => declineMutation.mutate(rid)}
                />
              );
            })}
          </section>
        )}

        {viewMode === "list" && !isLoading && (
          <section className="space-y-3">
            <h3 className="font-display font-bold text-sm px-1">فزعات تحتاج استجابة</h3>
            {otherItems.length === 0 && (
              <div className="rounded-2xl bg-card p-4 text-center text-sm text-muted-foreground">
                لا توجد طلبات أخرى حالياً.
              </div>
            )}
            {otherItems.map((item) => (
              <OtherRequestCard key={item.id} item={item} onOffer={(price) => offerMutation.mutate({ req: item, price })} />
            ))}
          </section>
        )}
      </div>

      {showComposer && <RequestComposer onClose={() => setShowComposer(false)} onSubmit={(payload) => createMutation.mutate(payload)} />}

      <RatingModal
        isOpen={!!ratingRequest}
        responderName={ratingRequest?.responderName || ""}
        loading={submitRatingMutation.isPending}
        onClose={() => setRatingRequest(null)}
        onSubmit={(rating) => submitRatingMutation.mutate(rating)}
      />
    </div>
  );
}

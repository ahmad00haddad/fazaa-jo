import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import MobileLayout from "./components/MobileLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { AnimatePresence, motion } from "framer-motion";

const Auth            = lazy(() => import("./pages/Auth"));
const Chat            = lazy(() => import("./pages/Chat"));
const CompleteProfile = lazy(() => import("./pages/CompleteProfile"));
const Fazaa           = lazy(() => import("./pages/Fazaa"));
const History         = lazy(() => import("./pages/History"));
const Home            = lazy(() => import("./pages/Home"));
const Leaderboard     = lazy(() => import("./pages/Leaderboard"));
const Me              = lazy(() => import("./pages/Me"));
const NotFound        = lazy(() => import("./pages/NotFound"));
const Services        = lazy(() => import("./pages/Services"));
const Notifications   = lazy(() => import("./pages/Notifications"));

const queryClient = new QueryClient();

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.15, ease: [0.4, 0, 1, 1] } },
};

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 rounded-2xl gradient-hero flex items-center justify-center shadow-glow animate-pulse-glow">
        <Loader2 className="w-5 h-5 animate-spin text-white" />
      </div>
      <span className="text-sm text-muted-foreground font-medium">جاري التحميل…</span>
    </div>
  </div>
);

// Animated page wrapper
function AnimatedPage({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="w-full"
    >
      {children}
    </motion.div>
  );
}

// Inner router that has access to location for AnimatePresence
function InnerRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<AnimatedPage><Home /></AnimatedPage>} />
        <Route path="/services" element={<AnimatedPage><Services /></AnimatedPage>} />
        <Route path="/chat" element={<AnimatedPage><Chat /></AnimatedPage>} />
        <Route path="/fazaa" element={<AnimatedPage><Fazaa /></AnimatedPage>} />
        <Route path="/me" element={<AnimatedPage><Me /></AnimatedPage>} />
        <Route path="/history" element={<AnimatedPage><History /></AnimatedPage>} />
        <Route path="/leaderboard" element={<AnimatedPage><Leaderboard /></AnimatedPage>} />
        <Route path="/notifications" element={<AnimatedPage><Notifications /></AnimatedPage>} />
        <Route path="*" element={<AnimatedPage><NotFound /></AnimatedPage>} />
      </Routes>
    </AnimatePresence>
  );
}

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" richColors />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/auth" element={<Auth />} />
                <Route path="/complete-profile" element={<CompleteProfile />} />
                <Route
                  path="*"
                  element={
                    <ProtectedRoute>
                      <MobileLayout>
                        <InnerRoutes />
                      </MobileLayout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;

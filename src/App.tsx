import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import MobileLayout from "./components/MobileLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import CompleteProfile from "./pages/CompleteProfile";
import Fazaa from "./pages/Fazaa";
import History from "./pages/History";
import Home from "./pages/Home";
import Leaderboard from "./pages/Leaderboard";
import Me from "./pages/Me";
import NotFound from "./pages/NotFound";
import Services from "./pages/Services";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <MobileLayout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/services" element={<Services />} />
                      <Route path="/chat" element={<Chat />} />
                      <Route path="/fazaa" element={<Fazaa />} />
                      <Route path="/me" element={<Me />} />
                      <Route path="/history" element={<History />} />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </MobileLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

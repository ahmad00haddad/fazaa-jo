import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MobileLayout from "./components/MobileLayout";
import Home from "./pages/Home";
import Services from "./pages/Services";
import ServicePage from "./pages/ServicePage";
import Chat from "./pages/Chat";
import Fazaa from "./pages/Fazaa";
import Me from "./pages/Me";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <MobileLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/services" element={<Services />} />
            <Route path="/service/:slug" element={<ServicePage />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/fazaa" element={<Fazaa />} />
            <Route path="/me" element={<Me />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MobileLayout>
      </Toaster>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;

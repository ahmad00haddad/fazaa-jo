import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

const clearPreviewCaches = () => {
  const host = window.location.hostname;
  const isPreview =
    host.includes("lovable.app") &&
    (host.startsWith("id-preview") || host.startsWith("preview") || window.location.search.includes("__lovable_sha"));

  if (!isPreview) return;

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
      .catch(() => undefined);
  }

  if ("caches" in window) {
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .catch(() => undefined);
  }
};

clearPreviewCaches();

createRoot(document.getElementById("root")!).render(<App />);

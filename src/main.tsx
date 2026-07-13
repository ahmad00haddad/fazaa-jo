import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// --- DEBUGGING INTERCEPTOR ---
// This will intercept all fetch requests and log them.
// It will also show an alert if it detects the exact error we are looking for.
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  const url = typeof args[0] === 'string' ? args[0] : args[0]?.url;
  const method = args[1]?.method || 'GET';
  
  if (url?.includes('supabase.co/rest/v1/')) {
    console.log(`[Supabase Fetch] ${method} ${url}`);
    if (args[1]?.body) {
      console.log(`[Supabase Fetch Payload]`, args[1].body);
    }
  }

  try {
    const response = await originalFetch(...args);
    const clonedResponse = response.clone();
    
    if (!response.ok && url?.includes('supabase.co/rest/v1/')) {
      clonedResponse.json().then(err => {
        console.error(`[Supabase Error] ${method} ${url}`, err);
        if (err?.message?.includes("schema cache") || err?.message?.includes("phone")) {
          alert(`خطأ تم رصده بدقة:\n\nالمسار: ${url}\nالعملية: ${method}\n\nالرسالة:\n${err.message}\n\nالبيانات المرسلة:\n${args[1]?.body}`);
        }
      }).catch(() => {});
    }
    
    return response;
  } catch (e) {
    console.error(`[Supabase Network Error] ${method} ${url}`, e);
    throw e;
  }
};
// -----------------------------

createRoot(document.getElementById("root")!).render(<App />);

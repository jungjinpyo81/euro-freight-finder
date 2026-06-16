import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ShippingCalculator } from "@/components/ShippingCalculator";
import "@/styles.css";

const queryClient = new QueryClient();

function App() {
  return (
    <main className="min-h-screen px-4 py-10 md:py-16">
      <ShippingCalculator />
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);

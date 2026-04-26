import React from "react";
import ReactDOM from "react-dom/client";
import { ShippingCalculator } from "@/components/ShippingCalculator";
import "@/styles.css";

function App() {
  return (
    <main className="min-h-screen px-4 py-10 md:py-16">
      <ShippingCalculator />
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

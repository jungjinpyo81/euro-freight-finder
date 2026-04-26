import { createFileRoute } from "@tanstack/react-router";
import { ShippingCalculator } from "@/components/ShippingCalculator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "International Air Shipping Quote Calculator | Premium F&B Import" },
      {
        name: "description",
        content:
          "유럽 프리미엄 F&B 수입 전문 — 영국·프랑스·이탈리아·독일 → 한국 항공 운임을 실시간으로 계산해드립니다.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen px-4 py-10 md:py-16">
      <ShippingCalculator />
    </main>
  );
}

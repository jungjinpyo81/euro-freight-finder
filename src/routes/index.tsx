import { createFileRoute } from "@tanstack/react-router";
import { ShippingCalculator } from "@/components/ShippingCalculator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      {
        title:
          "국제 항공 배송 견적 계산기 | Premium F&B Import",
      },
      {
        name: "description",
        content:
          "EUROPE CONNECT 운임표의 ZONE, Saver, Tarif 시트를 기준으로 수입과 수출 견적을 계산합니다.",
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

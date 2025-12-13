import AppShell from "@/components/layout/AppShell";
import { matters } from "@/lib/demoData";
import { Card } from "@/components/ui/card";
import { notFound } from "next/navigation";

type Props = {
  params: { id: string };
};

export default function MatterDetailPage({ params }: Props) {
  const matter = matters.find((m) => m.id === params.id);

  if (!matter) return notFound();

  return (
    <AppShell>
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-semibold">{matter.title}</h1>

        <Card className="p-4 space-y-2">
          <div>
            <strong>Court:</strong> {matter.court}
          </div>
          <div>
            <strong>Stage:</strong> {matter.stage}
          </div>
          <div>
            <strong>Parties:</strong> {matter.parties}
          </div>
          <div>
            <strong>Last Order:</strong> {matter.lastOrder}
          </div>
          <div>
            <strong>Next Hearing:</strong> {matter.nextHearing}
          </div>
        </Card>

        <div className="flex gap-4">
          <a
            href="/upload"
            className="px-4 py-2 bg-black text-white rounded inline-block"
          >
            Upload Document
          </a>

          <button className="px-4 py-2 border rounded">Generate Summary</button>
          <button className="px-4 py-2 border rounded">Draft Reply</button>
          <button className="px-4 py-2 border rounded">
            Compare Documents
          </button>
        </div>
      </div>
    </AppShell>
  );
}

import AppShell from "@/components/layout/AppShell";
import { matters } from "@/lib/demoData";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function MattersPage() {
  return (
    <AppShell>
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-semibold">Matters</h1>

        <div className="space-y-4">
          {matters.map((matter) => (
            <Link key={matter.id} href={`/matters/${matter.id}`}>
              <Card className="p-4 hover:bg-gray-50 cursor-pointer">
                <div className="font-medium">{matter.title}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {matter.stage} · Next Hearing: {matter.nextHearing}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

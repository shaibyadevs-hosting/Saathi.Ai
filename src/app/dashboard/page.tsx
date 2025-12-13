import AppShell from "@/components/layout/AppShell";
import { Card } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-semibold">Today’s Overview</h1>

        <div className="grid grid-cols-3 gap-6">
          <Card className="p-4">
            <div className="text-sm text-gray-500">Matters Today</div>
            <div className="text-2xl font-semibold mt-2">4</div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-gray-500">Pending Filings</div>
            <div className="text-2xl font-semibold mt-2">2</div>
          </Card>

          <Card className="p-4">
            <div className="text-sm text-gray-500">Next Hearing</div>
            <div className="text-lg font-medium mt-2">12 Oct 2025</div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

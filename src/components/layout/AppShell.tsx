"use client";

import { Separator } from "@/components/ui/separator";
import { usePathname } from "next/navigation";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  console.log("Current pathname:", pathname);

  return (
    <div className='flex h-screen'>
      {/* Sidebar */}
      <aside className='w-64 bg-white border-r'>
        <div className='p-6 font-semibold text-lg'>Saathi.ai</div>

        <Separator />

        <nav className='p-4 space-y-3 text-sm'>
          <a
            href='/dashboard'
            className={`block text-gray-700 ${
              pathname === "/dashboard" ? "font-medium text-gray-800" : ""
            }`}
          >
            Dashboard
          </a>
          <a
            href='/matters'
            className={`block text-gray-700 ${
              pathname === "/matters" ? "font-medium text-gray-800" : ""
            }`}
          >
            Matters
          </a>
          <a
            href='#'
            className={`block text-gray-700 ${
              pathname === "/drafts" ? "font-medium text-gray-800" : ""
            }`}
          >
            Drafts
          </a>
          <a
            href='#'
            className={`block text-gray-700 ${
              pathname === "/compare" ? "font-medium text-gray-800" : ""
            }`}
          >
            Compare
          </a>
        </nav>
      </aside>

      {/* Main Content */}
      <main className='flex-1 overflow-y-auto bg-gray-50'>{children}</main>
    </div>
  );
}

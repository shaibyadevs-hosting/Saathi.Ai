"use client";

import AppShell from "@/components/layout/AppShell";
import { useState } from "react";

export default function UploadPage() {
  const [text, setText] = useState("");

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const fileInput = e.currentTarget.file;
    if (!fileInput.files?.[0]) return;

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    setText(data.text);
  };
  const [summary, setSummary] = useState("");

  const generateSummary = async (type: string) => {
    const res = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, type }),
    });

    const data = await res.json();
    setSummary(data.result);
  };

  return (
    <AppShell>
      <div className="p-8 space-y-6">
        <h1 className="text-2xl font-semibold">Upload Document</h1>

        <form onSubmit={handleUpload} className="space-y-4">
          <input type="file" name="file" accept="application/pdf" required />

          <button
            type="submit"
            className="px-4 py-2 bg-black text-white rounded"
          >
            Upload & Read
          </button>
        </form>

        {text && (
          <div className="mt-6">
            <h2 className="font-medium mb-2">Extracted Text (Preview)</h2>
            <div className="p-4 bg-white border rounded text-sm max-h-96 overflow-y-auto whitespace-pre-wrap">
              {text.slice(0, 3000)}...
            </div>
          </div>
        )}
      </div>
      <div className="flex gap-4 mt-4">
        <button
          onClick={() => generateSummary("short")}
          className="px-3 py-1 border rounded"
        >
          5-Line Summary
        </button>

        <button
          onClick={() => generateSummary("detailed")}
          className="px-3 py-1 border rounded"
        >
          Detailed Summary
        </button>

        <button
          onClick={() => generateSummary("chronology")}
          className="px-3 py-1 border rounded"
        >
          Chronology
        </button>
      </div>
      {summary && (
        <div className="mt-6 p-4 bg-white border rounded whitespace-pre-wrap text-sm">
          {summary}
        </div>
      )}
    </AppShell>
  );
}

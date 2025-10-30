"use client";
import React, { useState } from "react";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8080";

type Item = { file: File; status: string };

export default function UploadPage() {
  const [orgId, setOrgId] = useState("demo");
  const [items, setItems] = useState<Item[]>([]);
  const [busy, setBusy] = useState(false);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setItems(files.map((f) => ({ file: f, status: "Ready" })));
  }

  async function uploadAll() {
    setBusy(true);
    const next = [...items];

    for (let i = 0; i < next.length; i++) {
      const it = next[i];
      const set = (s: string) => {
        next[i] = { ...it, status: s };
        setItems([...next]);
      };

      try {
        set("Requesting presign…");
        const initRes = await fetch(`${API_BASE}/documents/upload:init`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: it.file.name,
            content_type: it.file.type || "application/pdf",
            org_id: orgId,
          }),
        });
        if (!initRes.ok) throw new Error(`init ${it.file.name}: ${await initRes.text()}`);
        const init = await initRes.json();

        set("Uploading to S3…");
        const form = new FormData();
        Object.entries(init.fields).forEach(([k, v]: any) => form.append(k, v));
        form.append("file", it.file);
        const s3Res = await fetch(init.upload_url, { method: "POST", body: form });
        if (!s3Res.ok) throw new Error(`S3 ${it.file.name}: ${await s3Res.text()}`);

        set("Publishing…");
        const pub = await fetch(
          `${API_BASE}/documents/${encodeURIComponent(init.key)}/publish?source_type=AAOS`,
          { method: "POST" }
        );
        if (!pub.ok) throw new Error(`publish ${it.file.name}: ${await pub.text()}`);

        set("Queued ✅");
      } catch (err: any) {
        set(`Failed: ${err?.message || "error"}`);
      }
    }

    setBusy(false);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6 space-y-4">
        <h1 className="text-xl font-semibold">Upload guidelines / policies</h1>

        <div className="bg-white rounded-2xl shadow p-4 space-y-3">
          <label className="block text-sm font-medium text-gray-700">Organization</label>
          <input
            className="w-full rounded-xl border p-2"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            placeholder="demo"
          />

          <label className="block text-sm font-medium text-gray-700">Files</label>
          <input type="file" multiple accept=".pdf,.docx,.txt" onChange={onPick} />

          <div className="flex items-center gap-3">
            <button
              disabled={!items.length || busy}
              onClick={uploadAll}
              className={`px-4 py-2 rounded-xl text-white ${
                !items.length || busy ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {busy ? "Uploading…" : `Upload ${items.length} file${items.length > 1 ? "s" : ""}`}
            </button>
            <a href="/" className="text-sm underline text-gray-600" onClick={(e) => busy && e.preventDefault()}>
              ← Back to Q&A
            </a>
          </div>

          {items.length > 0 && (
            <div className="border rounded-xl divide-y">
              {items.map((it, idx) => (
                <div key={idx} className="p-2 text-sm flex items-center justify-between">
                  <span className="truncate mr-3">{it.file.name}</span>
                  <span className="text-gray-600">{it.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500">
          Files upload directly to S3 via presigned POST. After upload, they're queued for parsing → chunking → embedding.
        </p>
      </div>
    </div>
  );
}

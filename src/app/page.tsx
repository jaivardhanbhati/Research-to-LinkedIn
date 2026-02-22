"use client";

import { useState } from "react";
import type { SavedPost } from "@/types";

const LINKEDIN_POST_URL = "https://www.linkedin.com/feed/";

export default function Home() {
  const [topic, setTopic] = useState("");
  const [research, setResearch] = useState("");
  const [draft, setDraft] = useState("");
  const [feedback, setFeedback] = useState("");
  const [researchFeedback, setResearchFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [refineLoading, setRefineLoading] = useState(false);
  const [researchRefineLoading, setResearchRefineLoading] = useState(false);
  const [error, setError] = useState("");
  const [showResearch, setShowResearch] = useState(true);
  const [copied, setCopied] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function handleResearch() {
    if (!topic.trim()) {
      setError("Enter a topic to research.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Research failed");
      setResearch(data.research ?? "");
      setDraft(data.draft ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefine() {
    if (!draft.trim() || !feedback.trim()) {
      setError("Add feedback to refine the draft.");
      return;
    }
    setError("");
    setRefineLoading(true);
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft, feedback: feedback.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refine failed");
      setDraft(data.draft ?? draft);
      setFeedback("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setRefineLoading(false);
    }
  }

  async function handleRefineResearch() {
    if (!research.trim() || !researchFeedback.trim()) {
      setError("Add feedback to refine the research summary.");
      return;
    }
    setError("");
    setResearchRefineLoading(true);
    try {
      const res = await fetch("/api/refine-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ research, feedback: researchFeedback.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Refine failed");
      setResearch(data.research ?? research);
      setResearchFeedback("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setResearchRefineLoading(false);
    }
  }

  function handleSave() {
    if (!topic.trim() || !draft.trim()) {
      setError("Topic and draft are required to save.");
      return;
    }
    const id = crypto.randomUUID();
    const saved: SavedPost = {
      id,
      topic: topic.trim(),
      research,
      content: draft,
      createdAt: new Date().toISOString(),
    };
    const key = "research-to-linkedin-posts";
    const existing = typeof window !== "undefined" ? localStorage.getItem(key) : null;
    const list: SavedPost[] = existing ? JSON.parse(existing) : [];
    list.unshift(saved);
    localStorage.setItem(key, JSON.stringify(list));
    setSavedId(id);
    setError("");
  }

  function handleCopy() {
    if (!draft.trim()) return;
    navigator.clipboard.writeText(draft).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function downloadExport() {
    if (!topic.trim() || !draft.trim()) return;
    const blob = new Blob(
      [
        JSON.stringify(
          { topic: topic.trim(), research, content: draft, exportedAt: new Date().toISOString() },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `linkedin-post-${topic.slice(0, 30).replace(/\s+/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <header className="mb-10">
          <h1 className="font-serif text-3xl font-bold tracking-tight text-stone-800 sm:text-4xl">
            Research → LinkedIn
          </h1>
          <p className="mt-2 text-stone-600">
            Search a topic, get research and a draft, edit it, then save or publish to LinkedIn.
          </p>
        </header>

        {/* Step 1: Search */}
        <section className="mb-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-500">
            1. Choose a topic
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleResearch()}
              placeholder="e.g. AI in healthcare, remote work trends..."
              className="flex-1 rounded-lg border border-stone-300 bg-stone-50 px-4 py-3 text-stone-900 placeholder-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <button
              onClick={handleResearch}
              disabled={loading}
              className="rounded-lg bg-amber-600 px-5 py-3 font-medium text-white transition hover:bg-amber-700 disabled:opacity-60"
            >
              {loading ? "Researching…" : "Research"}
            </button>
          </div>
        </section>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-800">
            {error}
          </div>
        )}

        {/* Step 2: Research summary */}
        {research && (
          <section className="mb-8 rounded-2xl border border-stone-200 bg-white shadow-sm">
            <button
              type="button"
              onClick={() => setShowResearch((s) => !s)}
              className="flex w-full items-center justify-between p-6 text-left"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wider text-stone-500">
                2. Research summary
              </h2>
              <span className="text-stone-400">{showResearch ? "▼" : "▶"}</span>
            </button>
            {showResearch && (
              <div className="border-t border-stone-200 px-6 pb-6 pt-2">
                <textarea
                  value={research}
                  onChange={(e) => setResearch(e.target.value)}
                  rows={14}
                  className="mb-4 w-full resize-y rounded-lg border border-stone-300 bg-stone-50 px-4 py-3 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  placeholder="Research summary..."
                />
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    type="text"
                    value={researchFeedback}
                    onChange={(e) => setResearchFeedback(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleRefineResearch()}
                    placeholder="e.g. Add more statistics, shorten, focus on X..."
                    className="flex-1 rounded-lg border border-stone-300 bg-stone-50 px-4 py-2 text-stone-900 placeholder-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                  <button
                    onClick={handleRefineResearch}
                    disabled={researchRefineLoading || !researchFeedback.trim()}
                    className="rounded-lg border border-stone-300 bg-white px-4 py-2 font-medium text-stone-700 transition hover:bg-stone-100 disabled:opacity-50"
                  >
                    {researchRefineLoading ? "Refining…" : "Refine with AI"}
                  </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Step 3: Draft & edit */}
        {draft && (
          <section className="mb-8 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-500">
              3. Edit your post
            </h2>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={12}
              className="mb-4 w-full resize-y rounded-lg border border-stone-300 bg-stone-50 px-4 py-3 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              placeholder="Your LinkedIn post draft..."
            />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRefine()}
                placeholder="e.g. Make it shorter, add a CTA..."
                className="flex-1 rounded-lg border border-stone-300 bg-stone-50 px-4 py-2 text-stone-900 placeholder-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button
                onClick={handleRefine}
                disabled={refineLoading || !feedback.trim()}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 font-medium text-stone-700 transition hover:bg-stone-100 disabled:opacity-50"
              >
                {refineLoading ? "Refining…" : "Refine with AI"}
              </button>
            </div>
          </section>
        )}

        {/* Step 4: Save & Publish */}
        {draft && (
          <section className="mb-10 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-stone-500">
              4. Save & publish
            </h2>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSave}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 font-medium text-stone-700 transition hover:bg-stone-100"
              >
                Save to browser
              </button>
              <button
                onClick={downloadExport}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 font-medium text-stone-700 transition hover:bg-stone-100"
              >
                Download JSON
              </button>
              <button
                onClick={handleCopy}
                className="rounded-lg bg-[#0A66C2] px-4 py-2 font-medium text-white transition hover:bg-[#004182]"
              >
                {copied ? "Copied!" : "Copy for LinkedIn"}
              </button>
              <a
                href={LINKEDIN_POST_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#0A66C2] px-4 py-2 font-medium text-white transition hover:bg-[#004182]"
              >
                Open LinkedIn
                <span className="text-sm opacity-80">↗</span>
              </a>
            </div>
            {savedId && (
              <p className="mt-3 text-sm text-stone-600">Saved. Paste your post in LinkedIn after opening.</p>
            )}
          </section>
        )}

        <footer className="text-center text-sm text-stone-500">
          Paste your post in LinkedIn after clicking “Copy for LinkedIn” or “Open LinkedIn”.
        </footer>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
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
  const [linkedinConnected, setLinkedinConnected] = useState<boolean | null>(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/linkedin/status", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        setLinkedinConnected(data.connected === true);
      })
      .catch(() => setLinkedinConnected(false));
  }, []);

  useEffect(() => {
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const linkedin = params?.get("linkedin");
    if (linkedin === "connected") {
      setLinkedinConnected(true);
      setError("");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (linkedin === "denied" || linkedin === "error") {
      setError("LinkedIn connection was cancelled or failed.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (linkedin === "config" || linkedin === "token" || linkedin === "profile") {
      setError("LinkedIn connection failed. Check app configuration.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

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

  async function handlePublishToLinkedIn() {
    if (!draft.trim()) {
      setError("Draft is empty.");
      return;
    }
    setError("");
    setPublishedSuccess(false);
    setPublishLoading(true);
    try {
      const res = await fetch("/api/linkedin/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: draft }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) setLinkedinConnected(false);
        throw new Error(data.error || "Publish failed");
      }
      setPublishedSuccess(true);
      setTimeout(() => setPublishedSuccess(false), 5000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setPublishLoading(false);
    }
  }

  async function handleDisconnectLinkedIn() {
    await fetch("/api/linkedin/disconnect", { method: "POST", credentials: "include" });
    setLinkedinConnected(false);
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
        <header className="mb-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl font-bold tracking-tight text-stone-800 sm:text-4xl">
              LinkedIn Post Publisher
            </h1>
            <p className="mt-2 text-stone-600">
              Research a topic, get a draft, edit it, then save or publish to LinkedIn in one click.
            </p>
          </div>
          <a
            href="https://github.com/jaivardhanbhati/Research-to-LinkedIn"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-50 hover:border-stone-400"
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
            GitHub
          </a>
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
              className="flex-1 rounded-lg border border-stone-300 bg-stone-50 px-4 py-3 text-stone-900 placeholder-stone-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              onClick={handleResearch}
              disabled={loading}
              className="rounded-lg bg-[#0A66C2] px-5 py-3 font-medium text-white transition hover:bg-[#0A66C2] disabled:opacity-60"
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
              {linkedinConnected ? (
                <>
                  <button
                    onClick={handlePublishToLinkedIn}
                    disabled={publishLoading}
                    className="rounded-lg bg-[#0A66C2] px-4 py-2 font-medium text-white transition hover:bg-[#004182] disabled:opacity-60"
                  >
                    {publishLoading ? "Publishing…" : publishedSuccess ? "Published!" : "Publish to LinkedIn"}
                  </button>
                  <button
                    onClick={handleDisconnectLinkedIn}
                    className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <a
                  href="/api/linkedin/auth"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#0A66C2] px-4 py-2 font-medium text-white transition hover:bg-[#004182]"
                >
                  Connect LinkedIn
                </a>
              )}
              <button
                onClick={handleCopy}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 font-medium text-stone-700 transition hover:bg-stone-100"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <a
                href={LINKEDIN_POST_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 font-medium text-stone-700 transition hover:bg-stone-100"
              >
                Open LinkedIn
                <span className="text-sm opacity-80">↗</span>
              </a>
            </div>
            {publishedSuccess && (
              <p className="mt-3 text-sm font-medium text-green-700">Post published to your LinkedIn feed.</p>
            )}
            {savedId && !publishedSuccess && (
              <p className="mt-3 text-sm text-stone-600">Saved. Connect LinkedIn to publish with one click.</p>
            )}
          </section>
        )}

        <footer className="text-center text-sm text-stone-500">
          Connect LinkedIn to publish with one click. Otherwise use Copy and paste in LinkedIn.
        </footer>
      </div>
    </div>
  );
}

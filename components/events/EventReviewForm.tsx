"use client";

import { useState } from "react";

type Props = {
  eventId: string;
  existingScore?: number;
  existingComment?: string | null;
  onSuccess: () => void;
};

export default function EventReviewForm({ eventId, existingScore, existingComment, onSuccess }: Props) {
  const [score, setScore] = useState<number>(existingScore ?? 0);
  const [comment, setComment] = useState(existingComment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (score < 1 || score > 10) {
      setError("Please select a score between 1 and 10.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/events/${eventId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ score, comment: comment.trim() || null }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Failed to submit review.");

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800"
    >
      <h3 className="text-sm font-semibold text-foreground">
        {existingScore ? "Update your review" : "Leave a review"}
      </h3>

      {error && (
        <div role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50">
          {error}
        </div>
      )}

      {/* Score picker */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-foreground">
          Score <span className="text-red-500">*</span>
        </span>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setScore(n)}
              className={`h-9 w-9 rounded-lg text-sm font-semibold transition ${
                score === n
                  ? "bg-brand text-white"
                  : "border border-neutral-300 text-foreground hover:border-brand hover:text-brand dark:border-neutral-700"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
        {score > 0 && (
          <p className="text-xs text-neutral-500">
            Selected: <span className="font-semibold text-foreground">{score} / 10</span>
          </p>
        )}
      </div>

      {/* Comment */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="review-comment" className="text-sm font-medium text-foreground">
          Comment <span className="text-neutral-400">(optional)</span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Share your experience…"
          className="w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-brand dark:border-neutral-700"
        />
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving || score === 0}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:opacity-60"
        >
          {saving ? "Submitting…" : existingScore ? "Update review" : "Submit review"}
        </button>
      </div>
    </form>
  );
}

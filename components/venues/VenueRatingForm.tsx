"use client";

import { useState } from "react";

type Props = {
  venueId: string;
  existingRating?: {
    accessibilityScore: number;
    serviceScore: number;
    environmentScore: number;
    comment: string | null;
  };
  onSuccess: () => void;
};

function ScorePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-foreground">
        {label} <span className="text-red-500">*</span>
      </span>
      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            className={`h-9 w-9 rounded-lg text-sm font-semibold transition ${
              value === n
                ? "bg-brand text-white"
                : "border border-neutral-300 text-foreground hover:border-brand hover:text-brand dark:border-neutral-700"
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function VenueRatingForm({ venueId, existingRating, onSuccess }: Props) {
  const [accessibilityScore, setAccessibilityScore] = useState(
    existingRating?.accessibilityScore ?? 0
  );
  const [serviceScore, setServiceScore] = useState(existingRating?.serviceScore ?? 0);
  const [environmentScore, setEnvironmentScore] = useState(
    existingRating?.environmentScore ?? 0
  );
  const [comment, setComment] = useState(existingRating?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isUpdate = !!existingRating;
  const isValid = accessibilityScore > 0 && serviceScore > 0 && environmentScore > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isValid) {
      setError("Please rate all three categories.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/venues/${venueId}/ratings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accessibilityScore,
          serviceScore,
          environmentScore,
          comment: comment.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.message ?? "Failed to submit rating.");

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
      className="flex flex-col gap-5 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800"
    >
      <h3 className="text-sm font-semibold text-foreground">
        {isUpdate ? "Update your rating" : "Leave a rating"}
      </h3>

      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50"
        >
          {error}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-3">
        <ScorePicker
          label="Accessibility"
          value={accessibilityScore}
          onChange={setAccessibilityScore}
        />
        <ScorePicker label="Service" value={serviceScore} onChange={setServiceScore} />
        <ScorePicker
          label="Environment"
          value={environmentScore}
          onChange={setEnvironmentScore}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="venue-comment" className="text-sm font-medium text-foreground">
          Comment <span className="text-neutral-400">(optional)</span>
        </label>
        <textarea
          id="venue-comment"
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
          disabled={saving || !isValid}
          className="rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand/90 disabled:opacity-60"
        >
          {saving ? "Submitting…" : isUpdate ? "Update rating" : "Submit rating"}
        </button>
      </div>
    </form>
  );
}

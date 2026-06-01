"use client";

import { useState } from "react";

type Props = {
  reviewCount: number;
  favoriteCount: number;
};

type Tab = "reviews" | "favorites";

export default function ProfileTabs({ reviewCount, favoriteCount }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("reviews");

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "reviews", label: "Reviews", count: reviewCount },
    { id: "favorites", label: "Favorites", count: favoriteCount },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === tab.id
                ? "border-brand text-brand"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
            <span
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeTab === tab.id
                  ? "bg-primary-100 text-primary-700"
                  : "bg-neutral-100 text-neutral-500"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="py-6">
        {activeTab === "reviews" && (
          <div>
            {reviewCount === 0 ? (
              <EmptyState
                message="You haven't written any reviews yet."
                cta="Explore venues"
                href="/venues"
              />
            ) : (
              // Reviews list will be implemented in Story 5.2
              <p className="text-sm text-muted">Your reviews will appear here.</p>
            )}
          </div>
        )}

        {activeTab === "favorites" && (
          <div>
            {favoriteCount === 0 ? (
              <EmptyState
                message="You haven't saved any venues yet."
                cta="Explore venues"
                href="/venues"
              />
            ) : (
              // Favorites list will be implemented in Story 5.4
              <p className="text-sm text-muted">Your favorite venues will appear here.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({
  message,
  cta,
  href,
}: {
  message: string;
  cta: string;
  href: string;
}) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <p className="mb-3 text-sm text-muted">{message}</p>
      <a
        href={href}
        className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark"
      >
        {cta}
      </a>
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import Image from "next/image";

type Props = {
  user: {
    name: string;
    avatar: string | null;
    isPrivate: boolean;
  };
  onSuccess: (updated: { name?: string; avatar?: string; isPrivate?: boolean }) => void;
  onCancel: () => void;
};

export default function ProfileEditForm({ user, onSuccess, onCancel }: Props) {
  const [name, setName] = useState(user.name);
  const [isPrivate, setIsPrivate] = useState(user.isPrivate);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side preview
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
    setAvatarFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let newAvatarUrl: string | undefined;

      // Upload avatar first if a new file was selected
      if (avatarFile) {
        const formData = new FormData();
        formData.append("avatar", avatarFile);

        const avatarRes = await fetch("/api/users/me/avatar", {
          method: "POST",
          body: formData,
        });

        if (!avatarRes.ok) {
          const data = await avatarRes.json();
          throw new Error(data.error ?? "Failed to upload avatar");
        }

        const avatarData = await avatarRes.json();
        newAvatarUrl = avatarData.avatarUrl;
      }

      // Update profile fields
      const patchRes = await fetch("/api/users/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          isPrivate,
          ...(newAvatarUrl ? { avatar: newAvatarUrl } : {}),
        }),
      });

      if (!patchRes.ok) {
        const data = await patchRes.json();
        throw new Error(data.error ?? "Failed to update profile");
      }

      onSuccess({
        name,
        isPrivate,
        ...(newAvatarUrl ? { avatar: newAvatarUrl } : {}),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-8 rounded-xl border border-border bg-surface p-6"
    >
      <h2 className="mb-5 text-base font-semibold text-foreground">
        Edit profile
      </h2>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Avatar upload */}
      <div className="mb-5">
        <label className="mb-2 block text-sm font-medium text-foreground">
          Profile photo
        </label>
        <div className="flex items-center gap-4">
          <div className="relative h-14 w-14 overflow-hidden rounded-full bg-neutral-200">
            {avatarPreview ? (
              <Image
                src={avatarPreview}
                alt="Avatar preview"
                fill
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-bold text-neutral-500">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-foreground transition hover:bg-neutral-100"
          >
            Change photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
        <p className="mt-1.5 text-xs text-muted">
          JPEG, PNG, WebP or GIF. Max 2MB.
        </p>
      </div>

      {/* Name */}
      <div className="mb-5">
        <label
          htmlFor="name"
          className="mb-1.5 block text-sm font-medium text-foreground"
        >
          Display name
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {/* Privacy toggle */}
      <div className="mb-6 flex items-center justify-between rounded-lg border border-border bg-background px-4 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">Private profile</p>
          <p className="text-xs text-muted">
            When enabled, other users cannot see your contact information.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsPrivate((prev) => !prev)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand ${
            isPrivate ? "bg-brand" : "bg-neutral-300"
          }`}
          role="switch"
          aria-checked={isPrivate}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
              isPrivate ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-neutral-100"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}

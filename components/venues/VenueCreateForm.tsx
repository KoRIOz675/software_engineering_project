"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import VenuePhotoUploader from "@components/venues/VenuePhotoUploader";
import { uploadVenuePhotos } from "@/lib/uploadVenuePhotos";

const CATEGORIES = ["BAR", "MUSEUM", "PARK"] as const;

const fieldClasses =
  "w-full rounded-lg border border-neutral-300 bg-transparent px-3 py-2 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-foreground dark:border-neutral-700";

export default function VenueCreateForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [category, setCategory] = useState<string>("");
  const [files, setFiles] = useState<File[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Client-side validation of required fields.
    if (!name.trim() || !address.trim() || !city.trim() || !category) {
      setError("Name, address, city and category are required.");
      return;
    }
    if (!CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
      setError("Please select a valid category.");
      return;
    }

    // lat / lng: optional, but must be valid numbers if provided.
    let latValue: number | null = null;
    let lngValue: number | null = null;
    if (lat.trim()) {
      latValue = Number(lat);
      if (!Number.isFinite(latValue)) {
        setError("Latitude must be a valid number.");
        return;
      }
    }
    if (lng.trim()) {
      lngValue = Number(lng);
      if (!Number.isFinite(lngValue)) {
        setError("Longitude must be a valid number.");
        return;
      }
    }

    setSaving(true);
    try {
      // Upload selected files first, then create the venue with their URLs.
      const photos = await uploadVenuePhotos(files);

      const res = await fetch("/api/venues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ownerId is intentionally omitted — the API uses the session user.
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() === "" ? null : description,
          address: address.trim(),
          city: city.trim(),
          lat: latValue,
          lng: lngValue,
          category,
          photos,
        }),
      });

      if (res.status === 401) {
        throw new Error("You must be logged in to create a venue.");
      }
      if (res.status === 403) {
        throw new Error("Only venue owners can create venues.");
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message ?? "Failed to create venue.");
      }

      // Redirect to the newly created venue.
      router.push(`/venues/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 rounded-xl border border-neutral-200 p-6 dark:border-neutral-800"
    >
      {error && (
        <div
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50"
        >
          {error}
        </div>
      )}

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-foreground">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={fieldClasses}
        />
      </div>

      {/* Description */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="description"
          className="text-sm font-medium text-foreground"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className={fieldClasses}
        />
      </div>

      {/* Address */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="address" className="text-sm font-medium text-foreground">
          Address <span className="text-red-500">*</span>
        </label>
        <input
          id="address"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          className={fieldClasses}
        />
      </div>

      {/* City */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="city" className="text-sm font-medium text-foreground">
          City <span className="text-red-500">*</span>
        </label>
        <input
          id="city"
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
          className={fieldClasses}
        />
      </div>

      {/* Category */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="category" className="text-sm font-medium text-foreground">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          required
          className={fieldClasses}
        >
          <option value="" disabled>
            Select a category
          </option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c.charAt(0) + c.slice(1).toLowerCase()}
            </option>
          ))}
        </select>
      </div>

      {/* Coordinates */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lat" className="text-sm font-medium text-foreground">
            Latitude
          </label>
          <input
            id="lat"
            type="number"
            step="any"
            value={lat}
            onChange={(e) => setLat(e.target.value)}
            placeholder="48.8566"
            className={fieldClasses}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lng" className="text-sm font-medium text-foreground">
            Longitude
          </label>
          <input
            id="lng"
            type="number"
            step="any"
            value={lng}
            onChange={(e) => setLng(e.target.value)}
            placeholder="2.3522"
            className={fieldClasses}
          />
        </div>
      </div>

      {/* Photos */}
      <VenuePhotoUploader files={files} onFilesChange={setFiles} />

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-foreground px-5 py-2 text-sm font-semibold text-background transition hover:bg-foreground/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-60"
        >
          {saving ? "Creating..." : "Create venue"}
        </button>
      </div>
    </form>
  );
}

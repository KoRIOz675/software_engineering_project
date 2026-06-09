/**
 * Uploads venue photo files to the local upload API and returns their public
 * URLs. Returns an empty array when there are no files to upload.
 */
export async function uploadVenuePhotos(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];

  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const res = await fetch("/api/uploads/venues", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message ?? "Failed to upload photos.");
  }

  return (data.urls ?? []) as string[];
}

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

// Allowed image types mapped to a safe extension (derived from the MIME type,
// never from the original filename).
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    // `id` and `role` are added to the session in the NextAuth callbacks
    // (see lib/auth.ts) but are not part of the default Session.user type.
    const sessionUser = session?.user as
      | { id?: string; role?: string }
      | undefined;

    if (!sessionUser?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (sessionUser.role !== "VENUE_OWNER") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();
    const files = formData.getAll("files").filter((f): f is File => f instanceof File);

    if (files.length === 0) {
      return NextResponse.json({ message: "No files provided" }, { status: 400 });
    }

    // Validate every file before writing anything.
    for (const file of files) {
      if (!MIME_TO_EXT[file.type]) {
        return NextResponse.json(
          {
            message:
              "Invalid file type. Only JPEG, PNG, WebP and GIF images are allowed.",
          },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { message: "File too large. Maximum size is 5MB per file." },
          { status: 400 }
        );
      }
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "venues");
    await mkdir(uploadsDir, { recursive: true });

    const urls: string[] = [];
    for (const file of files) {
      const ext = MIME_TO_EXT[file.type];
      // Safe unique name — does not reuse the untrusted original filename.
      const filename = `${Date.now()}-${randomUUID()}.${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(uploadsDir, filename), buffer);
      urls.push(`/uploads/venues/${filename}`);
    }

    return NextResponse.json({ urls });
  } catch (error) {
    console.error("Venue Upload Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

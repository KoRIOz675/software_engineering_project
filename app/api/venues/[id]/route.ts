import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VENUE_CATEGORIES = ["BAR", "MUSEUM", "PARK"] as const;
type VenueCategoryValue = (typeof VENUE_CATEGORIES)[number];

// Fields a venue owner is allowed to update.
const UPDATABLE_FIELDS = [
  "name",
  "description",
  "address",
  "city",
  "lat",
  "lng",
  "category",
  "photos",
] as const;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const venue = await prisma.venue.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        city: true,
        lat: true,
        lng: true,
        category: true,
        photos: true,
        avgAccessibilityScore: true,
        avgServiceScore: true,
        avgEnvironmentScore: true,
        totalRatings: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!venue) {
      return NextResponse.json(
        { message: "Venue not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(venue);
  } catch (error) {
    console.error("Get Venue Error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    const venue = await prisma.venue.findUnique({
      where: { id },
      select: { ownerId: true },
    });

    if (!venue) {
      return NextResponse.json({ message: "Venue not found" }, { status: 404 });
    }

    // Ownership: only the venue's owner can update it.
    if (venue.ownerId !== sessionUser.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    // Reject unknown fields so protected columns (id, ownerId, scores, …)
    // can never be set from the request body.
    const unknownFields = Object.keys(body).filter(
      (key) => !UPDATABLE_FIELDS.includes(key as (typeof UPDATABLE_FIELDS)[number])
    );
    if (unknownFields.length > 0) {
      return NextResponse.json(
        { message: `Unknown fields: ${unknownFields.join(", ")}` },
        { status: 400 }
      );
    }

    const data: Prisma.VenueUpdateInput = {};

    // Required-string fields: must be non-empty strings when provided.
    for (const field of ["name", "address", "city"] as const) {
      if (field in body) {
        const value = body[field];
        if (typeof value !== "string" || value.trim() === "") {
          return NextResponse.json(
            { message: `${field} must be a non-empty string` },
            { status: 400 }
          );
        }
        data[field] = value;
      }
    }

    // description: string or null.
    if ("description" in body) {
      const { description } = body;
      if (description !== null && typeof description !== "string") {
        return NextResponse.json(
          { message: "description must be a string or null" },
          { status: 400 }
        );
      }
      data.description = description;
    }

    // lat / lng: number or null.
    for (const field of ["lat", "lng"] as const) {
      if (field in body) {
        const value = body[field];
        if (value !== null && typeof value !== "number") {
          return NextResponse.json(
            { message: `${field} must be a number or null` },
            { status: 400 }
          );
        }
        data[field] = value;
      }
    }

    // photos: array of strings.
    if ("photos" in body) {
      const { photos } = body;
      if (
        !Array.isArray(photos) ||
        !photos.every((p) => typeof p === "string")
      ) {
        return NextResponse.json(
          { message: "photos must be an array of strings" },
          { status: 400 }
        );
      }
      data.photos = photos;
    }

    // category: must be a valid VenueCategory enum value.
    if ("category" in body) {
      const { category } = body;
      if (!VENUE_CATEGORIES.includes(category as VenueCategoryValue)) {
        return NextResponse.json(
          {
            message: `Invalid category. Must be one of: ${VENUE_CATEGORIES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      data.category = category as VenueCategoryValue;
    }

    const updated = await prisma.venue.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        description: true,
        address: true,
        city: true,
        lat: true,
        lng: true,
        category: true,
        photos: true,
        avgAccessibilityScore: true,
        avgServiceScore: true,
        avgEnvironmentScore: true,
        totalRatings: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update Venue Error:", error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
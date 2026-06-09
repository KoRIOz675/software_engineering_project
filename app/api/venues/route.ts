import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VENUE_CATEGORIES = ["BAR", "MUSEUM", "PARK"] as const;
type VenueCategoryValue = (typeof VENUE_CATEGORIES)[number];

// Fields returned for the listing (used by the /venues page).
const VENUE_LIST_SELECT = {
  id: true,
  name: true,
  category: true,
  city: true,
  photos: true,
  avgAccessibilityScore: true,
  avgServiceScore: true,
  avgEnvironmentScore: true,
  totalRatings: true,
} satisfies Prisma.VenueSelect;

// Great-circle distance between two points in kilometers (Haversine).
function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10) || 10);
    const skip = (page - 1) * limit;

    // --- Build dynamic where clause from optional filters ---
    const where: Prisma.VenueWhereInput = {};

    // city: case-insensitive partial match
    const city = searchParams.get("city");
    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    // category: must be a valid VenueCategory enum value
    const category = searchParams.get("category");
    if (category) {
      if (!VENUE_CATEGORIES.includes(category as VenueCategoryValue)) {
        return NextResponse.json(
          {
            message: `Invalid category. Must be one of: ${VENUE_CATEGORIES.join(", ")}`,
          },
          { status: 400 }
        );
      }
      where.category = category as VenueCategoryValue;
    }

    // minScore: avgAccessibilityScore >= minScore, within 0–10
    const minScoreParam = searchParams.get("minScore");
    if (minScoreParam !== null) {
      const minScore = Number(minScoreParam);
      if (!Number.isFinite(minScore) || minScore < 0 || minScore > 10) {
        return NextResponse.json(
          { message: "minScore must be a number between 0 and 10" },
          { status: 400 }
        );
      }
      where.avgAccessibilityScore = { gte: minScore };
    }

    // lat + lng + radius: must be provided together
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");
    const radiusParam = searchParams.get("radius");
    const geoParams = [latParam, lngParam, radiusParam];
    const providedGeo = geoParams.filter((p) => p !== null).length;

    let geo: { lat: number; lng: number; radius: number } | null = null;
    if (providedGeo > 0) {
      if (providedGeo < 3) {
        return NextResponse.json(
          { message: "lat, lng and radius must all be provided together" },
          { status: 400 }
        );
      }
      const lat = Number(latParam);
      const lng = Number(lngParam);
      const radius = Number(radiusParam);
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radius)) {
        return NextResponse.json(
          { message: "lat, lng and radius must be valid numbers" },
          { status: 400 }
        );
      }
      if (radius <= 0) {
        return NextResponse.json(
          { message: "radius must be greater than 0" },
          { status: 400 }
        );
      }
      geo = { lat, lng, radius };
    }

    // --- Distance filter path: filter + paginate in code ---
    if (geo) {
      const candidates = await prisma.venue.findMany({
        where: { ...where, lat: { not: null }, lng: { not: null } },
        orderBy: { createdAt: "desc" },
        select: { ...VENUE_LIST_SELECT, lat: true, lng: true },
      });

      const withinRadius = candidates
        .map((venue) => ({
          venue,
          distance: distanceKm(geo.lat, geo.lng, venue.lat!, venue.lng!),
        }))
        .filter(({ distance }) => distance <= geo.radius)
        .sort((a, b) => a.distance - b.distance);

      const total = withinRadius.length;
      const paged = withinRadius
        .slice(skip, skip + limit)
        // Strip the helper lat/lng so the response keeps the listing shape.
        .map(({ venue }) => {
          const { lat: _lat, lng: _lng, ...rest } = venue;
          return rest;
        });

      return NextResponse.json({
        venues: paged,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    }

    // --- Standard path: paginate in the database ---
    const [venues, total] = await Promise.all([
      prisma.venue.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: VENUE_LIST_SELECT,
      }),
      prisma.venue.count({ where }),
    ]);

    return NextResponse.json({
      venues,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get Venues Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { name, description, address, city, lat, lng, category, photos } = body;

    // Validate required fields
    if (!name || !address || !city || !category) {
      return NextResponse.json(
        { message: "Missing required fields: name, address, city, category" },
        { status: 400 }
      );
    }

    // Validate category against the Prisma VenueCategory enum
    if (!VENUE_CATEGORIES.includes(category)) {
      return NextResponse.json(
        {
          message: `Invalid category. Must be one of: ${VENUE_CATEGORIES.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // Validate optional fields if provided
    if (photos !== undefined && !Array.isArray(photos)) {
      return NextResponse.json(
        { message: "photos must be an array" },
        { status: 400 }
      );
    }

    if (lat !== undefined && lat !== null && typeof lat !== "number") {
      return NextResponse.json(
        { message: "lat must be a number" },
        { status: 400 }
      );
    }

    if (lng !== undefined && lng !== null && typeof lng !== "number") {
      return NextResponse.json(
        { message: "lng must be a number" },
        { status: 400 }
      );
    }

    const venue = await prisma.venue.create({
      data: {
        name,
        description,
        address,
        city,
        lat,
        lng,
        category,
        photos: photos ?? [],
        ownerId: sessionUser.id,
      },
    });

    return NextResponse.json(venue, { status: 201 });
  } catch (error) {
    console.error("Create Venue Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

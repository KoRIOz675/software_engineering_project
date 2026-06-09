import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VENUE_CATEGORIES = ["BAR", "MUSEUM", "PARK"] as const;

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10) || 10);
    const skip = (page - 1) * limit;

    const [venues, total] = await Promise.all([
      prisma.venue.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          category: true,
          city: true,
          photos: true,
          avgAccessibilityScore: true,
          avgServiceScore: true,
          avgEnvironmentScore: true,
          totalRatings: true,
        },
      }),
      prisma.venue.count(),
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

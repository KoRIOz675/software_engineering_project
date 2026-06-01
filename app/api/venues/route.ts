import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

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

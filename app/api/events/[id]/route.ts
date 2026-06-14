import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        date: true,
        description: true,
        createdAt: true,
        venue: {
          select: {
            id: true,
            name: true,
            city: true,
            address: true,
            category: true,
            avgAccessibilityScore: true,
            avgServiceScore: true,
            avgEnvironmentScore: true,
            totalRatings: true,
          },
        },
        organizer: {
          select: {
            id: true,
            name: true,
          },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            score: true,
            comment: true,
            createdAt: true,
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    const avgScore =
      event.reviews.length > 0
        ? event.reviews.reduce((sum, r) => sum + r.score, 0) / event.reviews.length
        : null;

    return NextResponse.json({ ...event, avgScore });
  } catch (error) {
    console.error("Get Event Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

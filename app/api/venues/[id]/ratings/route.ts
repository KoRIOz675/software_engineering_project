import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string } | undefined;

    if (!sessionUser?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id: venueId } = await params;

    const venue = await prisma.venue.findUnique({
      where: { id: venueId },
      select: { id: true },
    });
    if (!venue) {
      return NextResponse.json({ message: "Venue not found" }, { status: 404 });
    }

    const body = await req.json();
    const { accessibilityScore, serviceScore, environmentScore, comment } = body;

    for (const [key, val] of [
      ["accessibilityScore", accessibilityScore],
      ["serviceScore", serviceScore],
      ["environmentScore", environmentScore],
    ] as [string, unknown][]) {
      const n = Number(val);
      if (!Number.isInteger(n) || n < 1 || n > 10) {
        return NextResponse.json(
          { message: `${key} must be an integer between 1 and 10` },
          { status: 400 }
        );
      }
    }

    const aScore = Number(accessibilityScore);
    const sScore = Number(serviceScore);
    const eScore = Number(environmentScore);

    await prisma.$transaction(async (tx) => {
      await tx.rating.upsert({
        where: { userId_venueId: { userId: sessionUser.id!, venueId } },
        create: {
          userId: sessionUser.id!,
          venueId,
          accessibilityScore: aScore,
          serviceScore: sScore,
          environmentScore: eScore,
        },
        update: {
          accessibilityScore: aScore,
          serviceScore: sScore,
          environmentScore: eScore,
        },
      });

      if (typeof comment === "string" && comment.trim()) {
        await tx.review.upsert({
          where: { userId_venueId: { userId: sessionUser.id!, venueId } },
          create: { userId: sessionUser.id!, venueId, comment: comment.trim() },
          update: { comment: comment.trim() },
        });
      }

      const agg = await tx.rating.aggregate({
        where: { venueId },
        _avg: {
          accessibilityScore: true,
          serviceScore: true,
          environmentScore: true,
        },
        _count: { _all: true },
      });

      await tx.venue.update({
        where: { id: venueId },
        data: {
          avgAccessibilityScore: agg._avg.accessibilityScore ?? 0,
          avgServiceScore: agg._avg.serviceScore ?? 0,
          avgEnvironmentScore: agg._avg.environmentScore ?? 0,
          totalRatings: agg._count._all,
        },
      });
    });

    return NextResponse.json({ message: "Rating submitted." });
  } catch (error) {
    console.error("POST venue rating error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

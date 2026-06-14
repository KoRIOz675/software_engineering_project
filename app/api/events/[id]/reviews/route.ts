import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await params;
    const { searchParams } = new URL(req.url);

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10) || 10);
    const skip = (page - 1) * limit;

    const eventExists = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!eventExists) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    const [reviews, total] = await Promise.all([
      prisma.eventReview.findMany({
        where: { eventId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          score: true,
          comment: true,
          createdAt: true,
          updatedAt: true,
          user: { select: { id: true, name: true, avatar: true } },
        },
      }),
      prisma.eventReview.count({ where: { eventId } }),
    ]);

    return NextResponse.json({
      reviews,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get Event Reviews Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

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

    const { id: eventId } = await params;

    const eventExists = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!eventExists) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }

    const body = await req.json();
    const { score, comment } = body;

    if (score === undefined || score === null) {
      return NextResponse.json({ message: "score is required" }, { status: 400 });
    }

    const parsedScore = Number(score);
    if (!Number.isInteger(parsedScore) || parsedScore < 1 || parsedScore > 10) {
      return NextResponse.json(
        { message: "score must be an integer between 1 and 10" },
        { status: 400 }
      );
    }

    const review = await prisma.eventReview.upsert({
      where: { userId_eventId: { userId: sessionUser.id, eventId } },
      create: {
        userId: sessionUser.id,
        eventId,
        score: parsedScore,
        comment: comment?.trim() || null,
      },
      update: {
        score: parsedScore,
        comment: comment?.trim() || null,
      },
      select: {
        id: true,
        score: true,
        comment: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, name: true, avatar: true } },
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Post Event Review Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

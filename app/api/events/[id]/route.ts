import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string; role?: string } | undefined;

    if (!sessionUser?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const event = await prisma.event.findUnique({ where: { id }, select: { organizerId: true } });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    if (event.organizerId !== sessionUser.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, date, venueId } = body;

    const data: { title?: string; description?: string | null; date?: Date; venueId?: string } = {};

    if (title !== undefined) data.title = String(title).trim();
    if (description !== undefined) data.description = description?.trim() || null;
    if (date !== undefined) {
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ message: "date must be a valid ISO date" }, { status: 400 });
      }
      data.date = parsedDate;
    }
    if (venueId !== undefined) {
      const venueExists = await prisma.venue.findUnique({ where: { id: venueId }, select: { id: true } });
      if (!venueExists) {
        return NextResponse.json({ message: "Venue not found" }, { status: 404 });
      }
      data.venueId = venueId;
    }

    const updated = await prisma.event.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update Event Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string; role?: string } | undefined;

    if (!sessionUser?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const event = await prisma.event.findUnique({ where: { id }, select: { organizerId: true } });

    if (!event) {
      return NextResponse.json({ message: "Event not found" }, { status: 404 });
    }
    if (event.organizerId !== sessionUser.id) {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    await prisma.event.delete({ where: { id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Delete Event Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

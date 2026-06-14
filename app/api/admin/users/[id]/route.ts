import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isUserRole } from "@/lib/roles";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string; role?: string } | undefined;

    if (!sessionUser?.id || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id: targetId } = await params;

    if (targetId === sessionUser.id) {
      return NextResponse.json(
        { message: "You cannot modify your own account." },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!target) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { isBanned, role } = body as Record<string, unknown>;

    const data: Record<string, unknown> = {};

    if (typeof isBanned === "boolean") {
      data.isBanned = isBanned;
    }

    if (role !== undefined) {
      if (!isUserRole(role)) {
        return NextResponse.json({ message: "Invalid role" }, { status: 400 });
      }
      data.role = role;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ message: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: targetId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBanned: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH admin user error:", error);
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

    if (!sessionUser?.id || sessionUser.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const { id: targetId } = await params;

    if (targetId === sessionUser.id) {
      return NextResponse.json(
        { message: "You cannot delete your own account." },
        { status: 400 }
      );
    }

    const target = await prisma.user.findUnique({
      where: { id: targetId },
      select: { id: true },
    });
    if (!target) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Collect IDs of user's organized events and owned venues
      const [userEvents, userVenues] = await Promise.all([
        tx.event.findMany({ where: { organizerId: targetId }, select: { id: true } }),
        tx.venue.findMany({ where: { ownerId: targetId }, select: { id: true } }),
      ]);
      const eventIds = userEvents.map((e) => e.id);
      const venueIds = userVenues.map((v) => v.id);

      // Clear records tied to user's events
      if (eventIds.length > 0) {
        await tx.eventReview.deleteMany({ where: { eventId: { in: eventIds } } });
        await tx.event.deleteMany({ where: { id: { in: eventIds } } });
      }

      // Clear records tied to user's venues (events hosted there + their reviews)
      if (venueIds.length > 0) {
        const venueEvents = await tx.event.findMany({
          where: { venueId: { in: venueIds } },
          select: { id: true },
        });
        const venueEventIds = venueEvents.map((e) => e.id);
        if (venueEventIds.length > 0) {
          await tx.eventReview.deleteMany({ where: { eventId: { in: venueEventIds } } });
          await tx.event.deleteMany({ where: { id: { in: venueEventIds } } });
        }
        await tx.review.deleteMany({ where: { venueId: { in: venueIds } } });
        await tx.rating.deleteMany({ where: { venueId: { in: venueIds } } });
        await tx.favorite.deleteMany({ where: { venueId: { in: venueIds } } });
        await tx.venue.deleteMany({ where: { id: { in: venueIds } } });
      }

      // Clear user's own activity records
      await tx.ambassador.deleteMany({
        where: { OR: [{ mentorId: targetId }, { menteeId: targetId }] },
      });
      await tx.message.deleteMany({
        where: { OR: [{ senderId: targetId }, { recipientId: targetId }] },
      });
      await tx.favorite.deleteMany({ where: { userId: targetId } });
      await tx.eventReview.deleteMany({ where: { userId: targetId } });
      await tx.review.deleteMany({ where: { userId: targetId } });
      await tx.rating.deleteMany({ where: { userId: targetId } });

      await tx.user.delete({ where: { id: targetId } });
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE admin user error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

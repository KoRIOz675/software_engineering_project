import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EVENT_LIST_SELECT = {
  id: true,
  title: true,
  date: true,
  description: true,
  venue: {
    select: {
      id: true,
      name: true,
      city: true,
      avgAccessibilityScore: true,
    },
  },
  organizer: {
    select: {
      id: true,
      name: true,
    },
  },
  _count: {
    select: { reviews: true },
  },
} satisfies Prisma.EventSelect;

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const limit = Math.max(1, parseInt(searchParams.get("limit") ?? "10", 10) || 10);
    const skip = (page - 1) * limit;

    const where: Prisma.EventWhereInput = {};

    const venueId = searchParams.get("venueId");
    if (venueId) where.venueId = venueId;

    const dateFromParam = searchParams.get("dateFrom");
    const dateToParam = searchParams.get("dateTo");
    const dateFilter: Prisma.DateTimeFilter<"Event"> = {};

    if (dateFromParam) {
      const d = new Date(dateFromParam);
      if (isNaN(d.getTime())) {
        return NextResponse.json(
          { message: "dateFrom must be a valid ISO date" },
          { status: 400 }
        );
      }
      dateFilter.gte = d;
    } else {
      dateFilter.gte = new Date();
    }

    if (dateToParam) {
      const d = new Date(dateToParam);
      if (isNaN(d.getTime())) {
        return NextResponse.json(
          { message: "dateTo must be a valid ISO date" },
          { status: 400 }
        );
      }
      dateFilter.lte = d;
    }

    where.date = dateFilter;

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "asc" },
        select: EVENT_LIST_SELECT,
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({
      events,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get Events Error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as { id?: string; role?: string } | undefined;

    if (!sessionUser?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (sessionUser.role !== "EVENT_ORGANIZER") {
      return NextResponse.json({ message: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, date, venueId } = body;

    if (!title || !date || !venueId) {
      return NextResponse.json(
        { message: "Missing required fields: title, date, venueId" },
        { status: 400 }
      );
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { message: "date must be a valid ISO date" },
        { status: 400 }
      );
    }

    const venueExists = await prisma.venue.findUnique({ where: { id: venueId }, select: { id: true } });
    if (!venueExists) {
      return NextResponse.json({ message: "Venue not found" }, { status: 404 });
    }

    const event = await prisma.event.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        date: parsedDate,
        venueId,
        organizerId: sessionUser.id,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Create Event Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

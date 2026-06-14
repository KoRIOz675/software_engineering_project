import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
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

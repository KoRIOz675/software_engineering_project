import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function parseDateParam(value: string, name: "dateFrom" | "dateTo") {
  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${name} value`);
  }

  return parsed;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFromParam = searchParams.get("dateFrom");
    const dateToParam = searchParams.get("dateTo");

    const dateFilter: { gte?: Date; lte?: Date } = {};

    if (dateFromParam) {
      dateFilter.gte = parseDateParam(dateFromParam, "dateFrom");
    }

    if (dateToParam) {
      dateFilter.lte = parseDateParam(dateToParam, "dateTo");
    }

    const events = await prisma.event.findMany({
      where: dateFilter.gte || dateFilter.lte ? { date: dateFilter } : undefined,
      orderBy: { date: "asc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid date")) {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    console.error("Get Events Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@lib/auth";
import { prisma } from "@lib/prisma";

// GET /api/users/me
export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      isPrivate: true,
      createdAt: true,
      _count: {
        select: {
          reviews: true,
          favorites: true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// PATCH /api/users/me
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, avatar, isPrivate } = body;

  // Only allow updating specific fields
  const updateData: { name?: string; avatar?: string; isPrivate?: boolean } =
    {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }
    updateData.name = name.trim();
  }

  if (avatar !== undefined) {
    updateData.avatar = avatar;
  }

  if (isPrivate !== undefined) {
    if (typeof isPrivate !== "boolean") {
      return NextResponse.json(
        { error: "isPrivate must be a boolean" },
        { status: 400 },
      );
    }
    updateData.isPrivate = isPrivate;
  }

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      isPrivate: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user);
}

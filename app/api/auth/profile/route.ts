// app/api/profile/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/auth-options";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions as any);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, image } = (await req.json().catch(() => ({}))) as {
    name?: string;
    image?: string | null; // data-URL of externe URL; null om te wissen
  };

  const updated = await prisma.user.update({
    where: { email: session.user.email },
    data: {
      ...(typeof name === "string" && name.trim() ? { name: name.trim().slice(0, 80) } : {}),
      ...(typeof image === "string" || image === null ? { image } : {}),
    },
    select: { id: true, name: true, email: true, image: true },
  });

  return NextResponse.json(updated);
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const promoters = await prisma.promoter.findMany({
        include: { supervisor: true },
        orderBy: { name: "asc" },
    });
    return NextResponse.json(promoters);
}

export async function POST(req: Request) {
    const body = await req.json();
    const promoter = await prisma.promoter.create({
        data: {
            name: body.name,
            city: body.city,
            state: body.state,
            supervisorId: body.supervisorId,
        },
    });
    return NextResponse.json(promoter);
}
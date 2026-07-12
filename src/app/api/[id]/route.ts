import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await req.json();
    const promoter = await prisma.promoter.update({
        where: { id },
        data: {
            name: body.name,
            city: body.city,
            state: body.state,
            supervisorId: body.supervisorId,
        },
    });
    return NextResponse.json(promoter);
}

export async function DELETE(
    _req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    await prisma.promoter.delete({ where: { id } });
    return NextResponse.json({ ok: true });
}
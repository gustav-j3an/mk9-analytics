import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const supervisor = await prisma.supervisor.create({
        data: { name: "Supervisor Teste", email: "supervisor@mk9.com" },
    });

    const promoter = await prisma.promoter.create({
        data: {
            name: "Promotor Teste",
            city: "Brasília",
            state: "DF",
            supervisorId: supervisor.id,
        },
    });

    const industry = await prisma.industry.create({
        data: { code: "IND001", name: "Indústria Teste" },
    });

    const store = await prisma.store.create({
        data: { code: "LJ001", name: "Loja Teste", chain: "Rede X", city: "Brasília", state: "DF" },
    });

    await prisma.visit.createMany({
        data: [
            { promoterId: promoter.id, storeId: store.id, industryId: industry.id, status: "PLANEJADA", scheduledDate: new Date() },
            { promoterId: promoter.id, storeId: store.id, industryId: industry.id, status: "PLANEJADA", scheduledDate: new Date() },
            { promoterId: promoter.id, storeId: store.id, industryId: industry.id, status: "REALIZADA", scheduledDate: new Date(), completedDate: new Date() },
        ],
    });

    console.log("Seed concluído.");
}

main()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
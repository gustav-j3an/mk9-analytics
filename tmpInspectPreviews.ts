import { prisma } from './src/lib/prisma';

async function main() {
  const previews = await prisma.importPreviewArtifact.findMany({
    where: { consumedAt: null, expiresAt: { gt: new Date() } },
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      import: { select: { id: true, operationId: true, status: true } },
    },
  });
  console.log(JSON.stringify(previews, null, 2));
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

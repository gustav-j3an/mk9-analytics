import { prisma } from './prisma';

export async function getOrCreateDefaultOperationId(): Promise<string> {
  const name = "MK9 - OPERAÇÃO PADRÃO";
  const defaultOp = await prisma.operation.findFirst({
    where: { name }
  });
  if (defaultOp) {
    return defaultOp.id;
  }
  const created = await prisma.operation.create({
    data: {
      name,
      month: 1,
      year: 2000,
      startsAt: new Date("2000-01-01T00:00:00Z"),
      endsAt: new Date("2099-12-31T23:59:59Z"),
      status: "OPEN"
    }
  });
  return created.id;
}

export async function getOrCreateDefaultOperationIdInTx(tx: any): Promise<string> {
  const name = "MK9 - OPERAÇÃO PADRÃO";
  const defaultOp = await tx.operation.findFirst({
    where: { name }
  });
  if (defaultOp) {
    return defaultOp.id;
  }
  const created = await tx.operation.create({
    data: {
      name,
      month: 1,
      year: 2000,
      startsAt: new Date("2000-01-01T00:00:00Z"),
      endsAt: new Date("2099-12-31T23:59:59Z"),
      status: "OPEN"
    }
  });
  return created.id;
}

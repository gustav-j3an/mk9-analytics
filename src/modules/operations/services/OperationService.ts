// Get all active promoters, stores, and industries
    const [promoters, stores, industries, existingVisits] = await Promise.all([
      prisma.promoter.findMany({ where: { supervisorId: { isNot: null } } }), // Active promoters have supervisors
      prisma.store.findMany(),
      prisma.industry.findMany(),
      prisma.visit.findMany({
        where: { operationId },
        // Select all fields to match Visit type
        select: {
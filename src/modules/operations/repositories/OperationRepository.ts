import { prisma } from '../../../lib/prisma';
import { Operation, OperationStatus } from '@prisma/client';

/**
 * Repository for Operation data access
 */
export class OperationRepository {
  /**
   * Create a new operation
   * @param data - Operation data
   * @returns Created operation
   */
  async create(data: Omit<Operation, 'id' | 'createdAt' | 'updatedAt'>) {
    return await prisma.operation.create({ data });
  }

  /**
   * Find an operation by ID
   * @param id - Operation ID
   * @returns Operation or null
   */
  async findById(id: string) {
    return await prisma.operation.findUnique({ where: { id } });
  }

  /**
   * Find operations with filtering and pagination
   * @param options - Filter and pagination options
   * @returns Paginated list of operations
   */
  async findMany(options: {
    page?: number;
    limit?: number;
    status?: OperationStatus;
    search?: string;
  } = {}) {
    const page = options.page ?? 1;
    const limit = options.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (options.status) {
      where.status = options.status;
    }

    if (options.search) {
      where.name = {
        contains: options.search,
        mode: 'insensitive',
      };
    }

    const [items, total] = await Promise.all([
      prisma.operation.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
      prisma.operation.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update an operation
   * @param id - Operation ID
   * @param data - Update data
   * @returns Updated operation
   */
  async update(id: string, data: Partial<Omit<Operation, 'id' | 'createdAt' | 'updatedAt'>>) {
    return await prisma.operation.update({ where: { id }, data });
  }

  /**
   * Delete an operation
   * @param id - Operation ID
   * @returns Deletion confirmation
   */
  async delete(id: string) {
    await prisma.operation.delete({ where: { id } });
    return { success: true };
  }

  /**
   * Count operations with optional filtering
   * @param where - Filter conditions
   * @returns Count of operations
   */
  async count(where: any = {}) {
    return await prisma.operation.count({ where });
  }

  /**
   * Check if operation exists for given month/year
   * @param month - Month (1-12)
   * @param year - Year
   * @param excludeId - ID to exclude from check
   * @returns True if operation exists
   */
  async existsForMonthYear(month: number, year: number, excludeId?: string) {
    const where: any = { month, year };
    if (excludeId) {
      where.id = { not: excludeId };
    }
    const count = await prisma.operation.count({ where });
    return count > 0;
  }
}
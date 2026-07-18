import { operationService } from '@/modules/operations/services/OperationService';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const dashboardData = await operationService.getDashboardData();
    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/opportunities - List all opportunities
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    const stage = searchParams.get('stage');

    const where: any = {};
    if (accountId) where.accountId = accountId;
    if (stage) where.currentStage = stage;

    const opportunities = await prisma.opportunity.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
        primaryContact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        documents: {
          select: {
            id: true,
            documentType: true,
            processingStatus: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(opportunities);
  } catch (error) {
    console.error('Error fetching opportunities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunities' },
      { status: 500 }
    );
  }
}

// POST /api/opportunities - Create new opportunity
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      accountId,
      primaryContactId,
      amount,
      expectedCloseDate,
      currentStage,
    } = body;

    if (!name || !accountId) {
      return NextResponse.json(
        { error: 'Opportunity name and account ID are required' },
        { status: 400 }
      );
    }

    // Initialize stage history
    const stageHistory = JSON.stringify([
      {
        stage: currentStage || 'Discovery',
        timestamp: new Date().toISOString(),
      },
    ]);

    const opportunity = await prisma.opportunity.create({
      data: {
        name,
        accountId,
        primaryContactId: primaryContactId || undefined,
        amount: amount ? parseFloat(amount) : undefined,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
        currentStage: currentStage || 'Discovery',
        stageHistory,
        overallHealthScore: 0,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
        primaryContact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json(opportunity, { status: 201 });
  } catch (error) {
    console.error('Error creating opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to create opportunity' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/opportunities/[id] - Get opportunity with all related data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const opportunity = await prisma.opportunity.findUnique({
      where: { id: params.id },
      include: {
        account: true,
        primaryContact: true,
        documents: {
          orderBy: {
            uploadDate: 'desc',
          },
        },
        meddpiccAnalysis: true,
        bantAnalysis: true,
        aiInsights: {
          orderBy: {
            generatedAt: 'desc',
          },
          take: 1, // Get only the latest insight
        },
        analysisSnapshots: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found' },
        { status: 404 }
      );
    }

    // Parse JSON fields
    const response = {
      ...opportunity,
      stageHistory: JSON.parse(opportunity.stageHistory),
      aiInsights: opportunity.aiInsights[0] ? {
        ...opportunity.aiInsights[0],
        redFlags: JSON.parse(opportunity.aiInsights[0].redFlags),
        nextActions: JSON.parse(opportunity.aiInsights[0].nextActions),
      } : null,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to fetch opportunity' },
      { status: 500 }
    );
  }
}

// PUT /api/opportunities/[id] - Update opportunity
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      name,
      amount,
      expectedCloseDate,
      currentStage,
      primaryContactId,
    } = body;

    // Fetch current opportunity to check if stage changed
    const currentOpp = await prisma.opportunity.findUnique({
      where: { id: params.id },
      select: { currentStage: true, stageHistory: true },
    });

    let stageHistory = currentOpp ? JSON.parse(currentOpp.stageHistory) : [];

    // If stage changed, add to history
    if (currentStage && currentOpp && currentStage !== currentOpp.currentStage) {
      stageHistory.push({
        stage: currentStage,
        timestamp: new Date().toISOString(),
      });
    }

    const opportunity = await prisma.opportunity.update({
      where: { id: params.id },
      data: {
        name,
        amount: amount ? parseFloat(amount) : undefined,
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : undefined,
        currentStage,
        primaryContactId,
        stageHistory: JSON.stringify(stageHistory),
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

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('Error updating opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to update opportunity' },
      { status: 500 }
    );
  }
}

// DELETE /api/opportunities/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.opportunity.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting opportunity:', error);
    return NextResponse.json(
      { error: 'Failed to delete opportunity' },
      { status: 500 }
    );
  }
}

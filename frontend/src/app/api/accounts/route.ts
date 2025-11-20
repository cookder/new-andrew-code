import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/accounts - List all accounts
export async function GET() {
  try {
    const accounts = await prisma.account.findMany({
      include: {
        opportunities: {
          select: {
            id: true,
            name: true,
            overallHealthScore: true,
            currentStage: true,
          },
        },
        contacts: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

// POST /api/accounts - Create new account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, industry, companySize, website, notes } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Account name is required' },
        { status: 400 }
      );
    }

    const account = await prisma.account.create({
      data: {
        name,
        industry,
        companySize: companySize ? parseInt(companySize) : undefined,
        website,
        notes,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}

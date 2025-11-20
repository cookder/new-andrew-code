import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/accounts/[id] - Get account by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const account = await prisma.account.findUnique({
      where: { id: params.id },
      include: {
        opportunities: true,
        contacts: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { error: 'Failed to fetch account' },
      { status: 500 }
    );
  }
}

// PUT /api/accounts/[id] - Update account
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, industry, companySize, website, notes } = body;

    const account = await prisma.account.update({
      where: { id: params.id },
      data: {
        name,
        industry,
        companySize: companySize ? parseInt(companySize) : undefined,
        website,
        notes,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

// DELETE /api/accounts/[id] - Delete account
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.account.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}

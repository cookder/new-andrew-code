import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/contacts - List all contacts (with optional accountId filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');

    const where = accountId ? { accountId } : {};

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

// POST /api/contacts - Create new contact
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      firstName,
      lastName,
      title,
      email,
      phone,
      stakeholderType,
      notes,
      accountId,
    } = body;

    if (!firstName || !lastName || !accountId) {
      return NextResponse.json(
        { error: 'First name, last name, and account ID are required' },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.create({
      data: {
        firstName,
        lastName,
        title,
        email,
        phone,
        stakeholderType: stakeholderType || 'Unknown',
        notes,
        accountId,
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}

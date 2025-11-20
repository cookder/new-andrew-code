import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/contacts/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: params.id },
      include: {
        account: true,
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error fetching contact:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact' },
      { status: 500 }
    );
  }
}

// PUT /api/contacts/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    } = body;

    const contact = await prisma.contact.update({
      where: { id: params.id },
      data: {
        firstName,
        lastName,
        title,
        email,
        phone,
        stakeholderType,
        notes,
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

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

// DELETE /api/contacts/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.contact.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
}

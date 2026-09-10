import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const data = await req.json();
    const { items, ...billData } = data;

    // Delete existing items
    await prisma.billItem.deleteMany({
      where: { billId: id }
    });

    // Update bill and create new items
    const updatedBill = await prisma.bill.update({
      where: { id: id },
      data: {
        ...billData,
        items: {
          create: items.map((item: Record<string, any>) => ({
            itemName: item.itemName,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.amount,
            unit: item.unit,
          }))
        }
      },
      include: { items: true }
    });

    return NextResponse.json({ success: true, bill: updatedBill });
  } catch (error) {
    console.error("Error updating bill:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

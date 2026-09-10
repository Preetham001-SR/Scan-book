import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import * as xlsx from "xlsx";
import { format } from "date-fns";

export async function GET() {
  try {
    const bills = await prisma.bill.findMany({
      orderBy: { createdAt: "desc" },
      include: { items: true },
    });

    // Transform data for Excel
    const excelData = bills.map((bill) => ({
      "Bill Number": bill.billNumber || "",
      "Date": bill.date ? format(new Date(bill.date), 'dd MMM yyyy') : "",
      "Customer/Vendor": bill.customerName || "",
      "Phone": bill.customerPhone || "",
      "Subtotal": bill.subtotal,
      "Tax": bill.tax,
      "Discount": bill.discount,
      "Total": bill.total,
      "Payment Method": bill.paymentMethod || "",
      "Status": bill.status,
      "Item Count": bill.items.length,
      "Items Details": bill.items.map(item => `${item.itemName} (${item.quantity} x ${item.rate})`).join("; ")
    }));

    // Create workbook and worksheet
    const worksheet = xlsx.utils.json_to_sheet(excelData);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Bills");

    // Generate buffer
    const buffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

    // Mark as Exported if they were Verified
    await prisma.bill.updateMany({
      where: {
        status: "Verified",
        id: { in: bills.map(b => b.id) }
      },
      data: {
        status: "Exported"
      }
    });

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="BillScan_Export_${format(new Date(), 'yyyy-MM-dd')}.xlsx"`,
      },
    });
  } catch (error) {
    console.error("Error exporting to Excel:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}

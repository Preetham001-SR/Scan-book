import prisma from "@/lib/prisma";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye, Download } from "lucide-react";
import Link from "next/link";

export default async function HistoryPage() {
  const bills = await prisma.bill.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Scan History</h2>
        <div className="flex gap-2">
          <Link href="/api/export/excel">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export All to Excel
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bill No</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((bill) => (
              <TableRow key={bill.id}>
                <TableCell className="font-medium">{bill.billNumber || 'N/A'}</TableCell>
                <TableCell>{bill.date ? format(new Date(bill.date), 'dd MMM, yyyy') : 'N/A'}</TableCell>
                <TableCell>{bill.customerName || 'N/A'}</TableCell>
                <TableCell>{bill.items.length}</TableCell>
                <TableCell>₹{bill.total?.toFixed(2) || '0.00'}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    bill.status === 'Verified' ? 'bg-green-100 text-green-800' :
                    bill.status === 'Exported' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {bill.status}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Link href={`/verify/${bill.id}`}>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {bills.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  No scanned bills found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

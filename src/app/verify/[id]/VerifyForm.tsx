"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash, Check, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";

export default function VerifyForm({ initialData }: { initialData: Record<string, any> }) {
  const router = useRouter();
  const [bill, setBill] = useState(initialData);
  const [items, setItems] = useState<Record<string, any>[]>(initialData.items || []);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const safeFloat = (val: any) => {
    const num = parseFloat(val);
    if (isNaN(num)) return 0;
    return Math.round(num * 100) / 100;
  };

  const handleBillChange = (field: string, value: string | number | Date) => {
    setBill({ ...bill, [field]: value });
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto calculate amount if quantity and rate change
    if (field === 'quantity' || field === 'rate') {
      const qty = safeFloat(newItems[index].quantity);
      const rate = safeFloat(newItems[index].rate);
      newItems[index].amount = safeFloat(qty * rate);
    }
    
    setItems(newItems);
    recalculateTotals(newItems);
  };

  const addItem = () => {
    setItems([...items, { itemName: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    recalculateTotals(newItems);
  };

  const recalculateTotals = (currentItems: Record<string, any>[]) => {
    const subtotal = currentItems.reduce((sum, item) => sum + safeFloat(item.amount), 0);
    const tax = safeFloat(bill.tax);
    const discount = safeFloat(bill.discount);
    const total = safeFloat(subtotal + tax - discount);
    
    setBill({ ...bill, subtotal: safeFloat(subtotal), total });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg("");
    try {
      const response = await fetch(`/api/bills/${bill.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...bill,
          items,
          status: "Verified"
        }),
      });

      if (!response.ok) throw new Error("Failed to save");
      
      router.push("/");
    } catch (error) {
      console.error("Error saving bill:", error);
      setErrorMsg("Failed to save the verified bill. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <Button variant="outline" className="w-fit" onClick={() => router.push("/")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
          </Button>
        </div>
        
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{errorMsg}</p>
          </div>
        )}

        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Original Image</CardTitle>
          </CardHeader>
          <CardContent>

            {bill.originalImage ? (
              <div className="relative w-full aspect-[3/4]">
                <Image 
                  src={bill.originalImage} 
                  alt="Scanned Bill" 
                  fill
                  className="rounded-md border object-contain" 
                  unoptimized
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-muted rounded-md border">
                No Image Available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Extracted Data</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="billNumber">Bill/Invoice Number</Label>
                <Input 
                  id="billNumber" 
                  value={bill.billNumber || ""} 
                  onChange={(e) => handleBillChange("billNumber", e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input 
                  id="date" 
                  type="date"
                  value={bill.date ? format(new Date(bill.date), 'yyyy-MM-dd') : ""} 
                  onChange={(e) => handleBillChange("date", new Date(e.target.value))} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerName">Customer/Vendor Name</Label>
              <Input 
                id="customerName" 
                value={bill.customerName || ""} 
                onChange={(e) => handleBillChange("customerName", e.target.value)} 
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Phone</Label>
                <Input 
                  id="customerPhone" 
                  value={bill.customerPhone || ""} 
                  onChange={(e) => handleBillChange("customerPhone", e.target.value)} 
                />
              </div>
            </div>

            <div className="pt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Items</h3>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" /> Add Item
                </Button>
              </div>
              
              <div className="border rounded-md overflow-hidden overflow-x-auto">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-20">Qty</TableHead>
                      <TableHead className="w-24">Rate</TableHead>
                      <TableHead className="w-24">Total</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="p-2">
                          <Input 
                            value={item.itemName || ""} 
                            onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input 
                            type="number"
                            value={item.quantity || ""} 
                            onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input 
                            type="number"
                            value={item.rate || ""} 
                            onChange={(e) => handleItemChange(index, "rate", e.target.value)}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input 
                            type="number"
                            value={item.amount || ""} 
                            onChange={(e) => handleItemChange(index, "amount", e.target.value)}
                            className="h-8"
                          />
                        </TableCell>
                        <TableCell className="p-2 text-center">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-destructive"
                            onClick={() => removeItem(index)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {items.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                          No items added.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t mt-6">
              <div className="space-y-2">
                <Label htmlFor="tax">Tax Amount</Label>
                <Input 
                  id="tax" 
                  type="number"
                  value={bill.tax || 0} 
                  onChange={(e) => {
                    handleBillChange("tax", e.target.value);
                    setBill((prev: Record<string, any>) => ({
                      ...prev, 
                      total: safeFloat(safeFloat(prev.subtotal) + safeFloat(e.target.value || "0") - safeFloat(prev.discount))
                    }));
                  }} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="total">Final Total</Label>
                <Input 
                  id="total" 
                  type="number"
                  value={bill.total || 0} 
                  onChange={(e) => handleBillChange("total", e.target.value)} 
                  className="font-bold text-lg"
                />
              </div>
            </div>

            <div className="flex justify-end pt-6 space-x-4">
              <Button 
                variant="outline" 
                onClick={() => router.push("/")}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Save Verified Bill
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

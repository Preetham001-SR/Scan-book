import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import VerifyForm from "./VerifyForm";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bill = await prisma.bill.findUnique({
    where: { id: id },
    include: { items: true },
  });

  if (!bill) {
    notFound();
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Verify Bill</h2>
      </div>
      <VerifyForm initialData={bill} />
    </div>
  );
}

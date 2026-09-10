import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import prisma from "@/lib/prisma";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, and WebP are allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${uuidv4()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const uploadDir = path.join(process.cwd(), "public/uploads");
    
    // Ensure upload dir exists
    await mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, fileName);
    await writeFile(filePath, buffer);
    const fileUrl = `/uploads/${fileName}`;

    // Mock AI Extraction
    // In a real scenario, we'd send the image to OpenAI/Gemini here.
    
    // Generate a random bill number
    const billNumber = `INV-${Math.floor(Math.random() * 10000)}`;
    const totalAmount = Math.floor(Math.random() * 5000) + 100;
    
    // Save to database
    const bill = await prisma.bill.create({
      data: {
        originalImage: fileUrl,
        billNumber: billNumber,
        date: new Date(),
        customerName: "Mock Vendor Inc.",
        total: totalAmount,
        subtotal: totalAmount,
        status: "Needs Verification", // Needs verification
        items: {
          create: [
            {
              itemName: "Item 1",
              quantity: 1,
              rate: totalAmount * 0.4,
              amount: totalAmount * 0.4,
            },
            {
              itemName: "Item 2",
              quantity: 2,
              rate: totalAmount * 0.3,
              amount: totalAmount * 0.6,
            }
          ]
        }
      },
    });

    return NextResponse.json({ success: true, billId: bill.id });
  } catch (error) {
    console.error("Error in /api/bills/extract:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

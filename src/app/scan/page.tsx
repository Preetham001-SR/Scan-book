"use client";

import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Camera, Upload, Check, X, Loader2, AlertCircle } from "lucide-react";
import Image from "next/image";
import ReactCrop, { Crop, PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

export default function ScanPage() {
  const router = useRouter();
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setImageSrc(imageSrc);
    }
  }, [webcamRef]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || null);
      });
      reader.readAsDataURL(file);
    }
  };

  const getCroppedImg = async (
    image: HTMLImageElement,
    crop: PixelCrop
  ): Promise<Blob> => {
    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // Default to the full image if no crop area is selected
    if (!crop.width || !crop.height) {
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(image, 0, 0);
      }
    } else {
      canvas.width = crop.width * scaleX;
      canvas.height = crop.height * scaleY;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.drawImage(
          image,
          crop.x * scaleX,
          crop.y * scaleY,
          crop.width * scaleX,
          crop.height * scaleY,
          0,
          0,
          crop.width * scaleX,
          crop.height * scaleY
        );
      }
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Canvas is empty"));
          return;
        }
        resolve(blob);
      }, "image/jpeg", 0.95);
    });
  };

  const handleConfirm = async () => {
    if (!imageSrc || !imgRef.current) return;
    
    setIsProcessing(true);
    setErrorMsg("");
    
    try {
      // If crop is extremely small or not defined, just use the full image. 
      // For simplicity here, we assume if completedCrop is present and valid, we use it, otherwise full image
      const safeCrop = completedCrop?.width ? completedCrop : { x: 0, y: 0, width: imgRef.current.width, height: imgRef.current.height, unit: 'px' as const };
      
      const croppedBlob = await getCroppedImg(imgRef.current, safeCrop);
      const formData = new FormData();
      formData.append("image", croppedBlob, "scan.jpg");

      const response = await fetch("/api/bills/extract", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to extract bill");
      }

      if (data.success && data.billId) {
        router.push(`/verify/${data.billId}`);
      }
    } catch (error: any) {
      console.error("Error processing image:", error);
      setErrorMsg(error.message || "Failed to process image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Scan Bill</h2>
      </div>

      <div className="flex flex-col items-center gap-4 w-full">
        {errorMsg && (
          <div className="w-full max-w-3xl bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-red-700 text-sm">{errorMsg}</p>
          </div>
        )}
        <Card className="w-full max-w-3xl">
          <CardHeader>
            <CardTitle>{imageSrc ? "Review & Crop" : "Capture Image"}</CardTitle>
            <CardDescription>
              {imageSrc 
                ? "Adjust the crop area to focus on the bill content, then confirm." 
                : "Take a photo of your bill or upload an existing image."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            {!imageSrc ? (
              <div className="w-full flex flex-col items-center gap-4">
                <div className="relative w-full aspect-[4/3] bg-muted rounded-md overflow-hidden border">
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "environment" }}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex gap-4">
                  <Button onClick={capture} size="lg" className="w-40">
                    <Camera className="mr-2 h-5 w-5" />
                    Capture
                  </Button>
                  <Button variant="outline" size="lg" className="w-40" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-5 w-5" />
                    Upload
                  </Button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center gap-4">
                <div className="relative max-h-[60vh] overflow-hidden border rounded-md">
                  <ReactCrop
                    crop={crop}
                    onChange={(c) => setCrop(c)}
                    onComplete={(c) => setCompletedCrop(c)}
                  >
                    <Image
                      ref={imgRef as any}
                      src={imageSrc}
                      alt="Captured bill"
                      className="max-h-[60vh] w-auto object-contain"
                      width={1200}
                      height={1200}
                      unoptimized
                      onLoad={(e) => {
                        // Set default crop to center 80% on load
                        setCrop({
                          unit: '%',
                          x: 10,
                          y: 10,
                          width: 80,
                          height: 80,
                        });
                      }}
                    />
                  </ReactCrop>
                </div>
                
                <div className="flex gap-4">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={() => setImageSrc(null)}
                    disabled={isProcessing}
                  >
                    <X className="mr-2 h-5 w-5" />
                    Retake
                  </Button>
                  <Button 
                    size="lg" 
                    onClick={handleConfirm}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-5 w-5" />
                    )}
                    {isProcessing ? "Processing..." : "Confirm & Extract"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

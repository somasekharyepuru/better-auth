"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface QRCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export function QRCodeComponent({
  value,
  size = 200,
  className = "",
}: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      QRCode.toCanvas(canvasRef.current, value, {
        width: size,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      }).catch((error) => {
        console.error("Error generating QR code:", error);
      });
    }
  }, [value, size]);

  if (!value) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 border rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-gray-500 text-sm">No QR code data</span>
      </div>
    );
  }

  return (
    <div className={`flex justify-center ${className}`}>
      <canvas
        ref={canvasRef}
        className="border rounded-lg"
        style={{ maxWidth: size, maxHeight: size }}
      />
    </div>
  );
}

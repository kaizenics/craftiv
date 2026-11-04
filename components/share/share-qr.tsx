"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Download } from "@/components/ui/icons";

// Medium error correction survives a slightly smudged or creased printout without making the code dense.
const OPTIONS = { errorCorrectionLevel: "M", margin: 1, color: { dark: "#18181b", light: "#ffffff" } } as const;

/** A QR code of the share link, drawn in the browser, with a print-resolution PNG download. */
export function ShareQr({ url, fileName }: { url: string; fileName: string }) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    QRCode.toDataURL(url, { ...OPTIONS, width: 240 }).then(
      (data) => alive && setPreview(data),
      () => alive && setPreview(null),
    );
    return () => {
      alive = false;
    };
  }, [url]);

  const download = async () => {
    try {
      const link = document.createElement("a");
      link.href = await QRCode.toDataURL(url, { ...OPTIONS, width: 1024 });
      link.download = `${fileName}.png`;
      link.click();
    } catch {
      toast.error("Couldn't create the QR code. Please try again.");
    }
  };

  if (!preview) return null;
  return (
    <div className="flex items-center gap-4 rounded-lg border p-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- a generated data URL, nothing for next/image to optimise */}
      <img src={preview} alt={`QR code for ${url}`} width={96} height={96} className="shrink-0 rounded-md" />
      <div className="min-w-0 space-y-2">
        <p className="text-sm font-medium">QR code</p>
        <p className="text-xs text-muted-foreground">Add it to a printed resume so readers can open the live version.</p>
        <Button type="button" variant="outline" size="sm" onClick={download}>
          <Download className="h-3.5 w-3.5" />
          Download PNG
        </Button>
      </div>
    </div>
  );
}

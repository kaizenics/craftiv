import { ImageResponse } from "next/og";
import { OgCard, ogAlt, ogContentType, ogSize } from "@/lib/og-card";

export const alt = ogAlt;
export const size = ogSize;
export const contentType = ogContentType;

export default function OpengraphImage() {
  return new ImageResponse(<OgCard />, { ...ogSize });
}

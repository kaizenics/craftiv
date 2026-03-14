"use client";

import { useState, useCallback } from "react";
import { ContactInfo } from "@/lib/types/resume";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Upload, X } from "lucide-react";
import Image from "next/image";
import Cropper from "react-easy-crop";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";

interface ContactsFormProps {
  data: ContactInfo;
  onChange: (data: ContactInfo) => void;
  showPhoto?: boolean;
  onShowPhotoChange?: (showPhoto: boolean) => void;
}

export function ContactsForm({
  data,
  onChange,
  showPhoto = false,
  onShowPhotoChange,
}: ContactsFormProps) {
  const [uploadError, setUploadError] = useState("");
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string>("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropComplete = useCallback(
    (croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleChange = (field: keyof ContactInfo, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image size must be less than 5MB");
      return;
    }

    setUploadError("");

    // Convert to base64 for cropping
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result as string);
      setShowCropDialog(true);
      // Reset crop state
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    handleChange("photoUrl", "");
    setUploadError("");
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new window.Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.setAttribute("crossOrigin", "anonymous");
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any
  ): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    // Set canvas size to the cropped area (square)
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error("Canvas is empty");
        }
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
      }, "image/jpeg");
    });
  };

  const handleCropSave = async () => {
    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      handleChange("photoUrl", croppedImage);
      setShowCropDialog(false);
      setImageToCrop("");
    } catch (e) {
      console.error(e);
      setUploadError("Failed to crop image");
    }
  };

  const handleCropCancel = () => {
    setShowCropDialog(false);
    setImageToCrop("");
    // Reset file input
    const fileInput = document.getElementById(
      "photo-upload"
    ) as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl font-bold mb-2">
          Contact Information
        </h2>
        <p className="text-muted-foreground">
          Let employers know how to reach you. This information will appear at
          the top of your resume.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">Show Profile Photo</p>
          <p className="text-xs text-muted-foreground">
            Turn this on to upload and display a photo in your resume.
          </p>
        </div>
        <Switch
          checked={showPhoto}
          onCheckedChange={(checked) => onShowPhotoChange?.(checked)}
        />
      </div>

      {showPhoto && (
        <div className="space-y-2">
          <Label>Profile Photo</Label>
          {data.photoUrl ? (
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-24 rounded-full overflow-hidden border-2 border-zinc-200">
                <Image
                  src={data.photoUrl}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-sm text-muted-foreground">
                  Photo uploaded successfully
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRemovePhoto}
                >
                  <X className="mr-2 h-4 w-4" />
                  Remove Photo
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <label
                htmlFor="photo-upload"
                className="flex items-center justify-center h-24 w-24 rounded-full border-2 border-dashed border-zinc-300 cursor-pointer hover:border-zinc-400 transition-colors"
              >
                <Upload className="h-8 w-8 text-zinc-400" />
                <input
                  id="photo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </label>
              <div className="flex-1">
                <p className="text-sm font-medium mb-1">Upload your photo</p>
                <p className="text-xs text-muted-foreground">
                  Recommended: Square image, max 5MB. Accepts JPG, PNG, or GIF.
                </p>
                {uploadError && (
                  <p className="text-xs text-red-500 mt-1">{uploadError}</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crop Your Photo</DialogTitle>
            <DialogDescription>
              Adjust and crop your photo to fit a square format (1:1 ratio). Use
              the slider to zoom and drag to reposition.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative h-96 bg-zinc-100 rounded-lg overflow-hidden">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <div className="space-y-2">
              <Label>Zoom</Label>
              <Slider
                value={[zoom]}
                onValueChange={(value) => setZoom(value[0])}
                min={1}
                max={3}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCropCancel}>
              Cancel
            </Button>
            <Button onClick={handleCropSave}>Save Photo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            placeholder="John"
            value={data.firstName}
            onChange={(e) => handleChange("firstName", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            placeholder="Doe"
            value={data.lastName}
            onChange={(e) => handleChange("lastName", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="desiredJobTitle">Desired Job Title</Label>
        <Input
          id="desiredJobTitle"
          placeholder="e.g. Software Engineer, Product Manager, UX Designer"
          value={data.desiredJobTitle}
          onChange={(e) => handleChange("desiredJobTitle", e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          This will appear prominently on your resume and help recruiters
          understand your target role.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={data.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            placeholder="john.doe@example.com"
            value={data.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

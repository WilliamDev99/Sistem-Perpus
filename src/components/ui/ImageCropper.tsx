"use client";

import { useState, useRef, useCallback, useEffect } from "react";

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
}: ImageCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);

  // The crop circle size (in display pixels)
  const CROP_SIZE = 280;
  // Output resolution
  const OUTPUT_SIZE = 512;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);

      // Calculate initial scale to fill the crop area
      const minDim = Math.min(img.width, img.height);
      const initialScale = (CROP_SIZE + 40) / minDim;
      setScale(initialScale);
      setPosition({ x: 0, y: 0 });
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const getEventPos = (e: React.MouseEvent | React.TouchEvent) => {
    if ("touches" in e) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handlePointerDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const pos = getEventPos(e);
      setIsDragging(true);
      setDragStart({ x: pos.x - position.x, y: pos.y - position.y });
    },
    [position]
  );

  const handlePointerMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDragging) return;
      e.preventDefault();
      const pos = getEventPos(e);
      setPosition({
        x: pos.x - dragStart.x,
        y: pos.y - dragStart.y,
      });
    },
    [isDragging, dragStart]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setScale((prev) => Math.max(0.1, Math.min(5, prev + delta)));
    },
    []
  );

  const handleCrop = async () => {
    if (!imageRef.current || !canvasRef.current || !containerRef.current) return;

    setProcessing(true);

    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;

      const img = imageRef.current;
      const containerRect = containerRef.current.getBoundingClientRect();

      // Center of the container (where the crop circle is)
      const centerX = containerRect.width / 2;
      const centerY = containerRect.height / 2;

      // Image dimensions on screen
      const displayW = img.width * scale;
      const displayH = img.height * scale;

      // Image top-left on screen (relative to container)
      const imgLeft = centerX - displayW / 2 + position.x;
      const imgTop = centerY - displayH / 2 + position.y;

      // Crop circle top-left (relative to container)
      const cropLeft = centerX - CROP_SIZE / 2;
      const cropTop = centerY - CROP_SIZE / 2;

      // Convert crop area to source image coordinates
      const srcX = ((cropLeft - imgLeft) / displayW) * img.width;
      const srcY = ((cropTop - imgTop) / displayH) * img.height;
      const srcW = (CROP_SIZE / displayW) * img.width;
      const srcH = (CROP_SIZE / displayH) * img.height;

      // Draw circular clip
      ctx.beginPath();
      ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      // Draw the cropped portion
      ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            onCropComplete(blob);
          }
          setProcessing(false);
        },
        "image/png",
        0.95
      );
    } catch {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-surface-container">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-container flex items-center justify-between">
          <div>
            <h3 className="font-h3 text-h3 text-on-surface">Potong Foto</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Geser dan perbesar untuk menyesuaikan
            </p>
          </div>
          <button
            onClick={onCancel}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors text-on-surface-variant"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Crop Area */}
        <div
          ref={containerRef}
          className="relative w-full aspect-square bg-black overflow-hidden cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onMouseLeave={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          onWheel={handleWheel}
        >
          {/* Image */}
          {imageLoaded && imageRef.current && (
            <div
              className="absolute inset-0 flex items-center justify-center"
              style={{
                transform: `translate(${position.x}px, ${position.y}px)`,
              }}
            >
              <img
                src={imageSrc}
                alt="Preview"
                className="pointer-events-none"
                draggable={false}
                style={{
                  width: imageRef.current.width * scale,
                  height: imageRef.current.height * scale,
                  maxWidth: "none",
                  maxHeight: "none",
                }}
              />
            </div>
          )}

          {/* Dark overlay with circular cutout */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <defs>
              <mask id="cropMask">
                <rect width="100" height="100" fill="white" />
                <circle cx="50" cy="50" r="35" fill="black" />
              </mask>
            </defs>
            <rect
              width="100"
              height="100"
              fill="rgba(0,0,0,0.6)"
              mask="url(#cropMask)"
            />
          </svg>

          {/* Crop circle border */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="rounded-full border-2 border-white/80 shadow-lg"
              style={{
                width: CROP_SIZE,
                height: CROP_SIZE,
                boxShadow: "0 0 0 1px rgba(255,255,255,0.3), inset 0 0 0 1px rgba(255,255,255,0.1)",
              }}
            />
          </div>

          {/* Loading state */}
          {!imageLoaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-white/20 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Zoom Slider */}
        <div className="px-6 py-4 border-t border-surface-container">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              photo_size_select_small
            </span>
            <input
              type="range"
              min="0.1"
              max="4"
              step="0.01"
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              className="flex-1 h-1.5 bg-surface-container-high rounded-full appearance-none cursor-pointer accent-primary
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-md
                [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
            />
            <span className="material-symbols-outlined text-on-surface-variant text-[18px]">
              photo_size_select_large
            </span>
          </div>
          <p className="text-center font-body-sm text-body-sm text-outline mt-1">
            {Math.round(scale * 100)}%
          </p>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-surface-container flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg font-label-md text-label-md text-on-surface border border-outline-variant hover:bg-surface-container-low transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleCrop}
            disabled={!imageLoaded || processing}
            className="px-5 py-2.5 bg-primary text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary/80 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">crop</span>
                Terapkan
              </>
            )}
          </button>
        </div>

        {/* Hidden canvas for cropping */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
}

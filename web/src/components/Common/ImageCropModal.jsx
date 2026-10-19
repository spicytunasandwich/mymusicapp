import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Check, RotateCcw, Sparkles, Loader2 } from 'lucide-react';

export default function ImageCropModal({
  isOpen,
  imageFile,
  cropType = 'avatar', // 'avatar' | 'banner'
  onClose,
  onApply
}) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSrc, setImageSrc] = useState(null);
  const [isGif, setIsGif] = useState(false);
  const [processing, setProcessing] = useState(false);

  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // Target storage dimensions
  const isAvatar = cropType === 'avatar';
  const targetWidth = isAvatar ? 512 : 1280;
  const targetHeight = isAvatar ? 512 : 480;
  const aspectRatio = isAvatar ? 1 : 8 / 3;

  // Preview box dimensions in the modal UI
  const boxWidth = isAvatar ? 280 : 440;
  const boxHeight = isAvatar ? 280 : Math.round(440 / (8 / 3)); // 165px

  useEffect(() => {
    if (!imageFile) {
      setImageSrc(null);
      return;
    }

    const gif = imageFile.type === 'image/gif' || imageFile.name.toLowerCase().endsWith('.gif');
    setIsGif(gif);

    const objectUrl = URL.createObjectURL(imageFile);
    setImageSrc(objectUrl);
    setZoom(1);
    setOffset({ x: 0, y: 0 });

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  if (!isOpen || !imageFile || !imageSrc) return null;

  // Drag handlers for interactive panning
  const handleMouseDown = (e) => {
    if (isGif) return; // GIFs are not cropped with 2D canvas to preserve animation
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || isGif) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (isGif || e.touches.length !== 1) return;
    setIsDragging(true);
    setDragStart({
      x: e.touches[0].clientX - offset.x,
      y: e.touches[0].clientY - offset.y
    });
  };

  const handleTouchMove = (e) => {
    if (!isDragging || isGif || e.touches.length !== 1) return;
    setOffset({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y
    });
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleConfirm = async () => {
    // For animated GIFs: Return original untouched File to prevent canvas flattening
    if (isGif) {
      onApply(imageFile);
      return;
    }

    setProcessing(true);
    try {
      const img = imageRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');

      // Scale factors from preview box to target storage resolution
      const scaleToTarget = targetWidth / boxWidth;

      // Draw background
      ctx.fillStyle = '#0B0C14';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      // Natural image aspect ratio
      const naturalAspect = img.naturalWidth / img.naturalHeight;
      let renderW, renderH;

      if (naturalAspect > aspectRatio) {
        // Image is wider than crop box
        renderH = boxHeight * zoom;
        renderW = renderH * naturalAspect;
      } else {
        // Image is taller than crop box
        renderW = boxWidth * zoom;
        renderH = renderW / naturalAspect;
      }

      // Center offset + user manual pan offset
      const posX = (boxWidth - renderW) / 2 + offset.x;
      const posY = (boxHeight - renderH) / 2 + offset.y;

      // Draw scaled and translated to target canvas
      ctx.drawImage(
        img,
        posX * scaleToTarget,
        posY * scaleToTarget,
        renderW * scaleToTarget,
        renderH * scaleToTarget
      );

      // Export as WebP / PNG Blob
      const mimeType = imageFile.type === 'image/png' ? 'image/png' : 'image/webp';
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            onApply(imageFile);
            return;
          }
          const croppedFile = new File([blob], imageFile.name, { type: mimeType });
          onApply(croppedFile);
          setProcessing(false);
        },
        mimeType,
        0.92
      );
    } catch (err) {
      console.error('Crop processing failed, falling back to original:', err);
      onApply(imageFile);
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#11121C] border border-[#23263B] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#23263B]">
          <div>
            <h3 className="font-bold text-white text-sm">
              {isAvatar ? 'Crop & Preview Avatar (1:1)' : 'Crop & Preview Banner (8:3)'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isAvatar ? 'Stored at 512×512 HD' : 'Stored at 1280×480 Retina HD'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Crop Viewport */}
        <div className="p-6 flex flex-col items-center">
          {isGif && (
            <div className="mb-3 px-3 py-1.5 rounded-lg bg-purple-900/40 border border-purple-500/30 text-purple-200 text-xs flex items-center gap-2">
              <Sparkles size={14} className="text-cyan-400 shrink-0" />
              <span>Animated GIF detected: Full animation frames are preserved!</span>
            </div>
          )}

          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            style={{ width: `${boxWidth}px`, height: `${boxHeight}px` }}
            className={`relative overflow-hidden bg-[#07080E] border-2 border-purple-500/60 shadow-inner select-none ${
              isAvatar ? 'rounded-full' : 'rounded-2xl'
            } ${!isGif ? 'cursor-grab active:cursor-grabbing' : ''}`}
          >
            {/* Image to be cropped/previewed */}
            <img
              ref={imageRef}
              src={imageSrc}
              alt="Crop preview"
              draggable={false}
              className={`w-full h-full object-cover transition-transform ${
                isGif ? '' : 'pointer-events-none'
              }`}
              style={
                !isGif
                  ? {
                      transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
                      transformOrigin: 'center'
                    }
                  : undefined
              }
            />

            {/* Viewfinder Overlay Guide */}
            {!isGif && (
              <div className="absolute inset-0 pointer-events-none border border-white/20">
                <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-30">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-white" />
                  <div className="border-r border-white" />
                  <div />
                </div>
              </div>
            )}
          </div>

          {/* Interactive Zoom Controls (for non-GIFs) */}
          {!isGif && (
            <div className="w-full max-w-xs flex items-center gap-3 mt-5 px-2">
              <ZoomOut size={16} className="text-slate-400 shrink-0" />
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-purple-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <ZoomIn size={16} className="text-slate-400 shrink-0" />
              <button
                type="button"
                onClick={handleReset}
                title="Reset zoom & position"
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition ml-1"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          )}

          {!isGif && (
            <p className="text-[11px] text-slate-500 mt-2">
              Drag to reposition • Scroll slider to zoom
            </p>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#23263B] bg-[#0E101A]">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={processing}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 text-white flex items-center gap-2 shadow-lg shadow-purple-900/40 hover:opacity-95 transition disabled:opacity-50 cursor-pointer"
          >
            {processing ? (
              <>
                <Loader2 size={14} className="animate-spin text-white" />
                <span>Processing HD...</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>Apply & Upload</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

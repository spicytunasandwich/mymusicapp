import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Check, RotateCcw, Sparkles, Loader2, AlertCircle } from 'lucide-react';

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
  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [processing, setProcessing] = useState(false);

  const imageRef = useRef(null);
  const containerRef = useRef(null);

  // Target storage dimensions
  const isAvatar = cropType === 'avatar';
  const targetWidth = isAvatar ? 512 : 1920;
  const targetHeight = isAvatar ? 512 : 720;
  const aspectRatio = isAvatar ? 1 : 8 / 3;

  // Preview box dimensions in the modal UI
  const boxWidth = isAvatar ? 280 : 440;
  const boxHeight = isAvatar ? 280 : Math.round(440 / (8 / 3)); // 165px

  // Keyboard Escape listener to cleanly dismiss stuck overlay
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Object URL lifecycle management
  useEffect(() => {
    if (!imageFile) {
      setImageSrc(null);
      setImageLoaded(false);
      setLoadError(false);
      return;
    }

    const gif = imageFile.type === 'image/gif' || imageFile.name?.toLowerCase().endsWith('.gif');
    setIsGif(gif);

    let url = null;
    try {
      url = URL.createObjectURL(imageFile);
      setImageSrc(url);
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      setImageLoaded(false);
      setLoadError(false);
    } catch (err) {
      console.error('Failed to create object URL for crop modal:', err);
      setLoadError(true);
    }

    return () => {
      if (url) {
        try {
          URL.revokeObjectURL(url);
        } catch (_) {}
      }
    };
  }, [imageFile]);

  // Attach non-passive wheel listener to container so e.preventDefault() never throws an error
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isGif) return;

    const handleWheelNonPassive = (e) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * -0.0015;
      setZoom(prev => Math.min(4, Math.max(1, prev + zoomDelta)));
    };

    container.addEventListener('wheel', handleWheelNonPassive, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheelNonPassive);
    };
  }, [isGif, imageSrc, imageLoaded]);

  if (!isOpen || !imageFile) return null;

  const touchDistance = useRef(null);

  // Drag handlers for interactive panning & pinch zoom
  const handleMouseDown = (e) => {
    if (isGif || loadError) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || isGif || loadError) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    touchDistance.current = null;
  };

  const handleTouchStart = (e) => {
    if (isGif || loadError) return;
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchDistance.current = dist;
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - offset.x,
        y: e.touches[0].clientY - offset.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (isGif || loadError) return;
    if (e.touches.length === 2 && touchDistance.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = (dist - touchDistance.current) * 0.005;
      setZoom(prev => Math.min(4, Math.max(1, prev + delta)));
      touchDistance.current = dist;
    } else if (isDragging && e.touches.length === 1) {
      setOffset({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    }
  };

  const handleReset = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleConfirm = async () => {
    // For animated GIFs or fallback on load error: Return original untouched File
    if (isGif || loadError) {
      onApply(imageFile);
      return;
    }

    setProcessing(true);
    try {
      const img = imageRef.current;
      if (!img || !img.naturalWidth || !img.naturalHeight) {
        onApply(imageFile);
        setProcessing(false);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        onApply(imageFile);
        setProcessing(false);
        return;
      }

      const scaleToTarget = targetWidth / boxWidth;
      ctx.fillStyle = '#0B0C14';
      ctx.fillRect(0, 0, targetWidth, targetHeight);

      const naturalAspect = img.naturalWidth / img.naturalHeight;
      let renderW, renderH;

      if (naturalAspect > aspectRatio) {
        renderH = boxHeight * zoom;
        renderW = renderH * naturalAspect;
      } else {
        renderW = boxWidth * zoom;
        renderH = renderW / naturalAspect;
      }

      const posX = (boxWidth - renderW) / 2 + offset.x;
      const posY = (boxHeight - renderH) / 2 + offset.y;

      ctx.drawImage(
        img,
        posX * scaleToTarget,
        posY * scaleToTarget,
        renderW * scaleToTarget,
        renderH * scaleToTarget
      );

      const mimeType = imageFile.type === 'image/png' ? 'image/png' : 'image/webp';
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            onApply(imageFile);
          } else {
            const croppedFile = new File([blob], imageFile.name, { type: mimeType });
            onApply(croppedFile);
          }
          setProcessing(false);
        },
        mimeType,
        0.92
      );
    } catch (err) {
      console.warn('Crop canvas processing failed, applying original image safely:', err);
      onApply(imageFile);
      setProcessing(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        // Outside click on backdrop cleanly dismisses the modal
        if (e.target === e.currentTarget && !processing) {
          onClose?.();
        }
      }}
      className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="w-full max-w-lg bg-[#11121C] border border-[#23263B] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#23263B]">
          <div>
            <h3 className="font-bold text-white text-sm">
              {isAvatar ? 'Crop & Preview Avatar (1:1)' : 'Crop & Preview Banner (8:3)'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isAvatar ? 'Stored at 512×512 HD' : 'Stored at 1920×720 Ultra HD'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition disabled:opacity-50"
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

          {loadError && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-red-900/30 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle size={15} className="text-red-400 shrink-0" />
              <span>Image preview unavailable. Click "Use Original" to proceed or Cancel.</span>
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
            className={`relative overflow-hidden bg-[#07080E] border-2 border-[#1DB954]/60 shadow-inner select-none ${
              isAvatar ? 'rounded-full' : 'rounded-2xl'
            } ${!isGif && !loadError ? 'cursor-grab active:cursor-grabbing' : ''}`}
          >
            {/* Image to be cropped/previewed */}
            {imageSrc && (
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                onLoad={() => setImageLoaded(true)}
                onError={() => {
                  console.warn('Failed to load image preview');
                  setLoadError(true);
                }}
                className={`w-full h-full object-cover transition-transform ${
                  isGif ? '' : 'pointer-events-none'
                }`}
                style={
                  !isGif && !loadError
                    ? {
                        transform: `scale(${zoom}) translate(${offset.x / zoom}px, ${offset.y / zoom}px)`,
                        transformOrigin: 'center'
                      }
                    : undefined
                }
              />
            )}

            {/* Viewfinder Overlay Guide */}
            {!isGif && !loadError && (
              <div className={`absolute inset-0 pointer-events-none border border-white/20 ${isAvatar ? 'rounded-full' : ''}`}>
                <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-30">
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div className="border-r border-b border-white" />
                  <div />
                </div>
              </div>
            )}
          </div>

          {/* Interactive Zoom Controls (for non-GIFs) */}
          {!isGif && !loadError && (
            <div className="w-full max-w-xs flex items-center gap-3 mt-5 px-2">
              <ZoomOut size={16} className="text-slate-400 shrink-0" />
              <input
                type="range"
                min="1"
                max="4"
                step="0.02"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-[#1DB954] cursor-pointer h-1.5 bg-slate-800 rounded-lg"
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

          {!isGif && !loadError && (
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
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1DB954] hover:bg-[#1ed760] text-black flex items-center gap-2 shadow-lg shadow-[#1DB954]/20 hover:scale-102 active:scale-98 transition disabled:opacity-50 cursor-pointer"
          >
            {processing ? (
              <>
                <Loader2 size={14} className="animate-spin text-black" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>{loadError ? 'Use Original' : 'Apply & Upload'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

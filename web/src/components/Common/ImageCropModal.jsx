import React, { useState, useRef, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Check, RotateCcw, Loader2 } from 'lucide-react';

export default function ImageCropModal({
  isOpen,
  imageFile,
  file,
  cropType = 'avatar', // 'avatar' | 'banner'
  cropShape, // 'round' | 'rect'
  onClose,
  onApply,
  onCropComplete
}) {
  const actualFile = imageFile || file;
  const isAvatar = (cropType === 'avatar') || (cropShape === 'round');
  const applyHandler = onApply || onCropComplete;

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
  const touchDistance = useRef(null);

  // Target output dimensions
  const targetWidth = isAvatar ? 512 : 1280;
  const targetHeight = isAvatar ? 512 : 480;
  const aspectRatio = isAvatar ? 1 : 8 / 3;

  // Viewport crop box dimensions (wide preview for banner ~600x225, round preview for avatar 280x280)
  const boxWidth = isAvatar ? 280 : 600;
  const boxHeight = isAvatar ? 280 : 225;

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Object URL lifecycle
  useEffect(() => {
    if (!actualFile) {
      setImageSrc(null);
      setImageLoaded(false);
      setLoadError(false);
      return;
    }

    const gif = actualFile.type === 'image/gif' || actualFile.name?.toLowerCase().endsWith('.gif');
    setIsGif(gif);

    let url = null;
    try {
      url = URL.createObjectURL(actualFile);
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
        try { URL.revokeObjectURL(url); } catch (_) {}
      }
    };
  }, [actualFile]);

  // Non-passive mouse-wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container || isGif) return;

    const handleWheelNonPassive = (e) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * -0.002;
      setZoom(prev => Math.min(4, Math.max(1, prev + zoomDelta)));
    };

    container.addEventListener('wheel', handleWheelNonPassive, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheelNonPassive);
    };
  }, [isGif, imageSrc, imageLoaded]);

  if (!isOpen || !actualFile) return null;

  // Mouse drag handlers
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

  // Touch handlers
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
    if (!applyHandler) {
      onClose?.();
      return;
    }

    // Preserve original animated GIFs without flattening
    if (isGif || loadError) {
      applyHandler(actualFile);
      return;
    }

    setProcessing(true);
    try {
      const img = imageRef.current;
      if (!img || !img.naturalWidth || !img.naturalHeight) {
        applyHandler(actualFile);
        setProcessing(false);
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        applyHandler(actualFile);
        setProcessing(false);
        return;
      }

      const scaleToTarget = targetWidth / boxWidth;
      ctx.fillStyle = '#0a0a0a';
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

      const mimeType = actualFile.type === 'image/png' ? 'image/png' : 'image/webp';
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            applyHandler(actualFile);
          } else {
            const croppedFile = new File([blob], actualFile.name, { type: mimeType });
            applyHandler(croppedFile);
          }
          setProcessing(false);
        },
        mimeType,
        0.92
      );
    } catch (err) {
      console.error('Failed to crop image:', err);
      applyHandler(actualFile);
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#121212] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold text-white">
              {isAvatar ? 'Crop Profile Picture' : 'Crop Banner Image'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isGif
                ? 'Animated GIF detected — animation will be preserved'
                : 'Drag to position • Scroll or use slider to zoom'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Viewport & Crop Canvas Area */}
        <div className="p-6 flex flex-col items-center justify-center bg-[#000000]">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleMouseUp}
            style={{ width: `${boxWidth}px`, height: `${boxHeight}px`, maxWidth: '100%' }}
            className={`relative overflow-hidden bg-[#0a0a0a] border-2 border-[var(--audira-accent,#1DB954)] shadow-2xl select-none ${
              isAvatar ? 'rounded-full' : 'rounded-xl'
            } ${!isGif && !loadError ? 'cursor-grab active:cursor-grabbing' : ''}`}
          >
            {imageSrc && (
              <img
                ref={imageRef}
                src={imageSrc}
                alt="Crop preview"
                draggable={false}
                onLoad={() => setImageLoaded(true)}
                onError={() => setLoadError(true)}
                className={`w-full h-full object-cover transition-transform ${isGif ? '' : 'pointer-events-none'}`}
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

            {/* Grid overlay for positioning reference */}
            {!isGif && !loadError && (
              <div className={`absolute inset-0 pointer-events-none border border-white/20 ${isAvatar ? 'rounded-full' : ''}`}>
                <div className="w-full h-full grid grid-cols-3 grid-rows-3 opacity-25">
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

          {/* Interactive Zoom Slider & Reset */}
          {!isGif && !loadError && (
            <div className="w-full max-w-sm flex items-center gap-3 mt-6 px-4">
              <ZoomOut size={16} className="text-slate-400 shrink-0" />
              <input
                type="range"
                min="1"
                max="4"
                step="0.02"
                value={zoom}
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-[var(--audira-accent,#1DB954)] cursor-pointer h-1.5 bg-slate-800 rounded-lg"
              />
              <ZoomIn size={16} className="text-slate-400 shrink-0" />
              <button
                type="button"
                onClick={handleReset}
                title="Reset zoom and position"
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition ml-1"
              >
                <RotateCcw size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/10 bg-[#121212]">
          <button
            type="button"
            onClick={onClose}
            disabled={processing}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={processing}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--audira-accent,#1DB954)] hover:opacity-90 text-black flex items-center gap-2 shadow-lg transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {processing ? (
              <>
                <Loader2 size={14} className="animate-spin text-black" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Check size={16} className="stroke-[3]" />
                <span>Apply & Save</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

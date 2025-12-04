import React, { useState, useRef, useEffect } from 'react';
import { X, Check, ZoomIn, ZoomOut } from 'lucide-react';

interface ImageCropperProps {
  imageSrc: string;
  aspectRatio: number; // 1 for avatar, 16/9 for banner
  onCrop: (blob: Blob) => void;
  onCancel: () => void;
}

export const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, aspectRatio, onCrop, onCancel }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(new Image());

  // Load image
  useEffect(() => {
    imgRef.current.crossOrigin = "anonymous"; // Critical for editing existing Firebase images
    imgRef.current.src = imageSrc;
    imgRef.current.onload = draw;
  }, [imageSrc]);

  // Redraw when zoom/pan changes
  useEffect(() => {
    draw();
  }, [zoom, offset]);

  const draw = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || !imgRef.current.complete) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match container width, calculating height based on aspect ratio
    const width = container.clientWidth;
    const height = width / aspectRatio;
    canvas.width = width;
    canvas.height = height;

    // Clear background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, width, height);

    // Calculate scaled dimensions
    const imgWidth = imgRef.current.width;
    const imgHeight = imgRef.current.height;
    
    // "Cover" logic: Scale image so it covers the canvas
    const scale = Math.max(width / imgWidth, height / imgHeight) * zoom;
    
    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;

    // Center image + offset
    const x = (width - scaledWidth) / 2 + offset.x;
    const y = (height - scaledHeight) / 2 + offset.y;

    ctx.drawImage(imgRef.current, x, y, scaledWidth, scaledHeight);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleSave = () => {
    if (!canvasRef.current) return;
    
    // Create a high-res export canvas
    const exportCanvas = document.createElement('canvas');
    const targetWidth = 1920; // High res width
    const targetHeight = targetWidth / aspectRatio;
    
    exportCanvas.width = targetWidth;
    exportCanvas.height = targetHeight;
    
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // Redraw at high res
    const imgWidth = imgRef.current.width;
    const imgHeight = imgRef.current.height;
    const scale = Math.max(targetWidth / imgWidth, targetHeight / imgHeight) * zoom;
    const scaledWidth = imgWidth * scale;
    const scaledHeight = imgHeight * scale;
    
    // Scale offset relative to target size vs display size
    const displayWidth = canvasRef.current.width;
    const ratio = targetWidth / displayWidth;
    
    const x = (targetWidth - scaledWidth) / 2 + (offset.x * ratio);
    const y = (targetHeight - scaledHeight) / 2 + (offset.y * ratio);

    try {
        ctx.drawImage(imgRef.current, x, y, scaledWidth, scaledHeight);
        
        exportCanvas.toBlob((blob) => {
            if (blob) onCrop(blob);
        }, 'image/jpeg', 0.9);
    } catch (e) {
        console.error("Canvas taint error (CORS)", e);
        // Fallback for tainted canvas (rare if rules are correct)
        alert("Unable to crop image due to browser security settings.");
        onCancel();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold">Adjust Image</h3>
        <button onClick={onCancel} className="p-1 hover:bg-white/10 rounded-full">
          <X className="w-5 h-5 text-gray-400" />
        </button>
      </div>

      <div 
        ref={containerRef}
        className="relative w-full bg-black/50 overflow-hidden rounded-xl cursor-move border border-white/10"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas ref={canvasRef} className="block w-full" />
      </div>

      <div className="mt-6 space-y-4">
        <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-gray-400" />
            <input 
                type="range" 
                min="1" 
                max="3" 
                step="0.1" 
                value={zoom} 
                onChange={(e) => setZoom(parseFloat(e.target.value))}
                className="w-full accent-brand-accent h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-gray-400" />
        </div>

        <button 
            onClick={handleSave}
            className="w-full py-3 bg-brand-accent text-white font-bold rounded-xl hover:bg-brand-accent/90 flex items-center justify-center gap-2"
        >
            <Check className="w-5 h-5" />
            Apply
        </button>
      </div>
    </div>
  );
};
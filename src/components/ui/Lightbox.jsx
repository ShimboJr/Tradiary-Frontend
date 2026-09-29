/**
 * components/ui/Lightbox.jsx
 * Full-screen image viewer with arrow key navigation.
 */
import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const Lightbox = ({ images, index, onClose, onNavigate }) => {
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft')  onNavigate(Math.max(0, index - 1));
      if (e.key === 'ArrowRight') onNavigate(Math.min(images.length - 1, index + 1));
    };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', handler); document.body.style.overflow = ''; };
  }, [index, images.length, onClose, onNavigate]);

  if (index === null || !images[index]) return null;
  const img = images[index];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.92)' }}
      onClick={onClose}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
      >
        <X size={20} className="text-white" />
      </button>

      {index > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(index - 1); }}
          className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>
      )}

      {index < images.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(index + 1); }}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
        >
          <ChevronRight size={24} className="text-white" />
        </button>
      )}

      <div onClick={e => e.stopPropagation()} className="max-w-5xl max-h-[90vh] flex flex-col items-center">
        <img
          src={img.url}
          alt={img.caption}
          className="max-h-[80vh] max-w-full object-contain rounded-lg shadow-2xl"
        />
        {img.caption && (
          <p className="mt-3 text-sm text-white/70">{img.caption}</p>
        )}
        <p className="mt-1 text-xs text-white/40">{index + 1} / {images.length}</p>
      </div>
    </div>
  );
};

export default Lightbox;

import { useState } from 'react';
import { DownloadSimple, ArrowsOut, X } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AttachmentGallery({ imageUrl, taskId }) {
  const [lightbox, setLightbox] = useState(false);

  if (!imageUrl) return null;

  const filename = imageUrl.split('/').pop()?.split('?')[0] ?? 'attachment';

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-brand-silver/40 uppercase tracking-wide">
        Attachment
      </span>

      <div className="relative group rounded-lg overflow-hidden border border-[var(--border-subtle)] bg-brand-elevated">
        <img
          src={imageUrl}
          alt="Task attachment"
          className="w-full max-h-48 object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-brand-base/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => setLightbox(true)}
            className="w-8 h-8 flex items-center justify-center rounded-md bg-brand-overlay/80 text-brand-silver hover:bg-brand-overlay transition-colors"
            aria-label="View full size"
          >
            <ArrowsOut size={15} />
          </button>
          <a
            href={imageUrl}
            download={filename}
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center rounded-md bg-brand-overlay/80 text-brand-silver hover:bg-brand-overlay transition-colors"
            aria-label="Download attachment"
            onClick={(e) => e.stopPropagation()}
          >
            <DownloadSimple size={15} />
          </a>
        </div>
      </div>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-brand-base/90 backdrop-blur-md p-4"
            onClick={() => setLightbox(false)}
          >
            <button
              className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-brand-elevated text-brand-silver hover:bg-brand-highlight transition-colors"
              onClick={() => setLightbox(false)}
              aria-label="Close lightbox"
            >
              <X size={16} />
            </button>
            <motion.img
              initial={{ scale: 0.92 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.92 }}
              src={imageUrl}
              alt="Task attachment"
              className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

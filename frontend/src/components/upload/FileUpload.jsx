import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadSimple, CheckCircle, XCircle, Image as ImageIcon } from '@phosphor-icons/react';
import { uploadApi } from '../../api/upload';
import { useUpdateTask } from '../../hooks/useTasks';
import { cn } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function FileUpload({ taskId, currentImageUrl }) {
  const [dragOver, setDragOver] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');
  const inputRef = useRef(null);
  const updateTask = useUpdateTask();

  const handleUpload = async (file) => {
    if (!file) return;

    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Only images allowed (JPEG, PNG, GIF, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10 MB');
      return;
    }

    setStatus('uploading');
    setProgress(0);

    try {
      const { uploadUrl, imageUrl: finalImageUrl } = await uploadApi.getPresignedUrl({
        taskId,
        filename: file.name,
        contentType: file.type,
      });

      await uploadApi.uploadToS3(uploadUrl, file, setProgress);

      updateTask.mutate(
        { id: taskId, data: { imageUrl: finalImageUrl } },
        {
          onSuccess: () => {
            setStatus('done');
            toast.success('Image uploaded');
            setTimeout(() => setStatus('idle'), 2500);
          },
          onError: () => {
            setStatus('error');
            toast.error('Upload failed');
          },
        }
      );
    } catch (err) {
      setStatus('error');
      toast.error('Upload failed');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  return (
    <div className="space-y-2">
      <span className="text-xs font-medium text-brand-silver/40 uppercase tracking-wide">
        {currentImageUrl ? 'Replace attachment' : 'Attach image'}
      </span>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => status === 'idle' && inputRef.current?.click()}
        className={cn(
          'relative rounded-lg border border-dashed cursor-pointer transition-all duration-200 px-4 py-5',
          'flex flex-col items-center justify-center gap-2',
          dragOver
            ? 'border-brand-rose bg-[var(--accent-rose-muted)]'
            : 'border-[var(--border-default)] hover:border-[var(--border-strong)] hover:bg-brand-elevated/50',
          status === 'uploading' && 'cursor-default pointer-events-none'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handleUpload(e.target.files?.[0])}
        />

        {status === 'idle' && (
          <>
            <UploadSimple size={20} className="text-brand-silver/25" />
            <p className="text-xs text-brand-silver/35 text-center">
              Drop an image or <span className="text-brand-rose/70">browse</span>
            </p>
            <p className="text-[10px] text-brand-silver/20">JPEG, PNG, GIF, WebP — max 10 MB</p>
          </>
        )}

        {status === 'uploading' && (
          <div className="w-full space-y-2">
            <div className="w-full h-1 rounded-full bg-brand-elevated overflow-hidden">
              <motion.div
                className="h-full bg-brand-rose rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <p className="text-xs text-brand-silver/40 text-center font-mono">{progress}%</p>
          </div>
        )}

        {status === 'done' && (
          <div className="flex items-center gap-2 text-brand-teal">
            <CheckCircle size={18} weight="fill" />
            <span className="text-xs">Upload complete</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-1 text-brand-rose">
            <XCircle size={18} weight="fill" />
            <span className="text-xs">Upload failed</span>
            <button
              onClick={(e) => { e.stopPropagation(); setStatus('idle'); }}
              className="text-[10px] underline text-brand-silver/40 hover:text-brand-silver/60"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

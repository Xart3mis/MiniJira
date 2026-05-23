import client from "./client";
import axios from "axios";

export const uploadApi = {
  getPresignedUrl: (data) =>
    client.post("/api/upload/presigned", data).then((r) => r.data.data),

  uploadToS3: (presignedUrl, file, onProgress) =>
    axios.put(presignedUrl, file, {
      headers: { "Content-Type": file.type },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    }),

  pollForResizedImage: (imageUrl, { timeoutMs = 30000, intervalMs = 2000 } = {}) =>
    new Promise((resolve, reject) => {
      const deadline = Date.now() + timeoutMs;

      const check = () => {
        const img = new Image();
        img.onload = () => resolve();
        img.onerror = () => {
          if (Date.now() >= deadline) {
            reject(new Error('Image processing timed out'));
            return;
          }
          setTimeout(check, intervalMs);
        };
        // cache-bust so the browser re-fetches each poll
        img.src = `${imageUrl}?_t=${Date.now()}`;
      };

      check();
    }),
};

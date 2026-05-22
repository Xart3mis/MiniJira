import client from './client';
import axios from 'axios';

export const uploadApi = {
  getPresignedUrl: (data) =>
    client.post('/api/upload/presigned', data).then((r) => r.data.data),

  uploadToS3: (presignedUrl, file, onProgress) =>
    axios.put(presignedUrl, file, {
      headers: { 'Content-Type': file.type },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      },
    }),
};

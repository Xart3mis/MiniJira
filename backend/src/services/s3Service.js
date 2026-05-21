/**
 * s3Service.js
 * Handles all S3 interactions for task image attachments.
 *
 * Bucket layout:
 *   originals bucket  →  tasks/<taskId>/<timestamp>-<filename>
 *   resized bucket    →  resized/thumb/tasks/<taskId>/...
 *                        resized/medium/tasks/<taskId>/...
 */

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { v4: uuidv4 } = require("uuid");
const path = require("path");

const region = process.env.AWS_REGION || "us-east-1";
const ORIGINALS_BUCKET = process.env.S3_ORIGINALS_BUCKET;
const RESIZED_BUCKET = process.env.S3_RESIZED_BUCKET;
const PRESIGNED_URL_EXPIRES = 3600; // 1 hour

const s3 = new S3Client({ region });

/**
 * Build the S3 key for a task image.
 * Format: tasks/<taskId>/<timestamp>-<uuid>.<ext>
 */
const buildKey = (taskId, originalName) => {
  const ext = path.extname(originalName).toLowerCase() || ".jpg";
  return `tasks/${taskId}/${Date.now()}-${uuidv4()}${ext}`;
};

/**
 * Upload a file buffer directly to S3 (used for multipart/form-data from the backend).
 * Returns the S3 key of the uploaded object.
 */
const uploadImage = async (taskId, fileBuffer, originalName, mimeType) => {
  const key = buildKey(taskId, originalName);

  await s3.send(
    new PutObjectCommand({
      Bucket: ORIGINALS_BUCKET,
      Key: key,
      Body: fileBuffer,
      ContentType: mimeType || "image/jpeg",
      Metadata: { taskId, originalName },
    })
  );

  console.log(`Uploaded original image: s3://${ORIGINALS_BUCKET}/${key}`);
  return key;
};

/**
 * Generate a pre-signed URL so the React frontend can upload directly to S3
 * without routing the file through the EC2 backend.
 * Returns: { uploadUrl, key }
 */
const getPresignedUploadUrl = async (taskId, originalName, mimeType) => {
  const key = buildKey(taskId, originalName);

  const cmd = new PutObjectCommand({
    Bucket: ORIGINALS_BUCKET,
    Key: key,
    ContentType: mimeType || "image/jpeg",
    Metadata: { taskId, originalName },
  });

  const uploadUrl = await getSignedUrl(s3, cmd, {
    expiresIn: PRESIGNED_URL_EXPIRES,
  });

  return { uploadUrl, key, bucket: ORIGINALS_BUCKET };
};

/**
 * Generate a pre-signed GET URL for a private original image.
 */
const getPresignedDownloadUrl = async (key, expiresIn = PRESIGNED_URL_EXPIRES) => {
  const cmd = new GetObjectCommand({ Bucket: ORIGINALS_BUCKET, Key: key });
  return getSignedUrl(s3, cmd, { expiresIn });
};

/**
 * Generate a pre-signed GET URL for a resized image.
 * suffix: "thumb" | "medium"
 */
const getResizedUrl = async (originalKey, suffix = "thumb", expiresIn = PRESIGNED_URL_EXPIRES) => {
  const resizedKey = `resized/${suffix}/${originalKey}`;
  const cmd = new GetObjectCommand({ Bucket: RESIZED_BUCKET, Key: resizedKey });
  return getSignedUrl(s3, cmd, { expiresIn });
};

/**
 * Delete an object from the originals bucket.
 */
const deleteImage = async (key) => {
  await s3.send(new DeleteObjectCommand({ Bucket: ORIGINALS_BUCKET, Key: key }));
  console.log(`Deleted original: s3://${ORIGINALS_BUCKET}/${key}`);
};

/**
 * Delete all versions of a task's images (all objects under tasks/<taskId>/).
 * Called when a task is fully deleted.
 */
const deleteAllTaskImages = async (taskId) => {
  const prefix = `tasks/${taskId}/`;

  // List all objects under this task prefix
  let continuationToken;
  const keys = [];

  do {
    const res = await s3.send(
      new ListObjectsV2Command({
        Bucket: ORIGINALS_BUCKET,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    (res.Contents || []).forEach((obj) => keys.push(obj.Key));
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);

  // Delete each object (the assignment says old versions are RETAINED,
  // so this is only used when the task itself is deleted)
  await Promise.all(keys.map((key) => deleteImage(key)));
  console.log(`Deleted ${keys.length} image(s) for taskId=${taskId}`);
};

/**
 * Replace a task's current image.
 * Old image key is retained in S3 (as per spec); new key is stored in DynamoDB.
 * Returns the new S3 key.
 */
const replaceImage = async (taskId, newFileBuffer, newOriginalName, newMimeType) => {
  // Just upload the new image — do NOT delete the old one (spec: keep old versions)
  return uploadImage(taskId, newFileBuffer, newOriginalName, newMimeType);
};

module.exports = {
  uploadImage,
  getPresignedUploadUrl,
  getPresignedDownloadUrl,
  getResizedUrl,
  deleteImage,
  deleteAllTaskImages,
  replaceImage,
};

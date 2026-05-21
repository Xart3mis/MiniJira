import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

const RESIZED_BUCKET = process.env.S3_RESIZED_BUCKET;
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const THUMB_WIDTH = 300;
const THUMB_HEIGHT = 300;

async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

export async function handler(event) {
    for (const record of event.Records) {
        const sourceBucket = record.s3.bucket.name;
        const sourceKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));

        // Only process objects under originals/
        if (!sourceKey.startsWith('originals/')) {
            console.log(`Skipping non-original key: ${sourceKey}`);
            continue;
        }

        console.log(`Processing: s3://${sourceBucket}/${sourceKey}`);

        try {
            // Download original
            const getResult = await s3.send(new GetObjectCommand({
                Bucket: sourceBucket,
                Key: sourceKey
            }));

            const originalBuffer = await streamToBuffer(getResult.Body);
            const contentType = getResult.ContentType || 'image/jpeg';

            // Resize to main display size
            const resizedBuffer = await sharp(originalBuffer)
                .resize(MAX_WIDTH, MAX_HEIGHT, { fit: 'inside', withoutEnlargement: true })
                .toBuffer();

            // Resize to thumbnail
            const thumbBuffer = await sharp(originalBuffer)
                .resize(THUMB_WIDTH, THUMB_HEIGHT, { fit: 'cover' })
                .toBuffer();

            const resizedKey = sourceKey.replace('originals/', 'resized/');
            const thumbKey = sourceKey.replace('originals/', 'thumbnails/');

            // Upload resized
            await s3.send(new PutObjectCommand({
                Bucket: RESIZED_BUCKET,
                Key: resizedKey,
                Body: resizedBuffer,
                ContentType: contentType
            }));

            // Upload thumbnail
            await s3.send(new PutObjectCommand({
                Bucket: RESIZED_BUCKET,
                Key: thumbKey,
                Body: thumbBuffer,
                ContentType: contentType
            }));

            console.log(`Uploaded resized: s3://${RESIZED_BUCKET}/${resizedKey}`);
            console.log(`Uploaded thumbnail: s3://${RESIZED_BUCKET}/${thumbKey}`);
        } catch (err) {
            console.error(`Error processing ${sourceKey}:`, err);
            throw err;
        }
    }
}

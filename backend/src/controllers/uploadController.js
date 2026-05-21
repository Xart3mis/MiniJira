import { v4 as uuidv4 } from 'uuid';
import { s3 } from '../config/aws.js';

const ORIGINALS_BUCKET = process.env.S3_ORIGINALS_BUCKET;
const RESIZED_BUCKET = process.env.S3_RESIZED_BUCKET;
const PRESIGNED_URL_EXPIRES = 300; // 5 minutes

export async function getPresignedUploadUrl(req, res, next) {
    try {
        const { filename, contentType } = req.body;

        if (!filename || !contentType) {
            return res.status(400).json({
                success: false,
                message: 'filename and contentType are required'
            });
        }

        if (!contentType.startsWith('image/')) {
            return res.status(400).json({
                success: false,
                message: 'contentType must be an image type (image/jpeg, image/png, etc.)'
            });
        }

        if (!ORIGINALS_BUCKET) {
            return res.status(500).json({
                success: false,
                message: 'S3 bucket not configured'
            });
        }

        const ext = filename.split('.').pop();
        const key = `originals/${uuidv4()}.${ext}`;

        const uploadUrl = s3.getSignedUrl('putObject', {
            Bucket: ORIGINALS_BUCKET,
            Key: key,
            ContentType: contentType,
            Expires: PRESIGNED_URL_EXPIRES
        });

        // The resized version will be written here by the imageResize Lambda
        const resizedKey = key.replace('originals/', 'resized/');
        const imageUrl = `https://${RESIZED_BUCKET}.s3.amazonaws.com/${resizedKey}`;

        res.json({
            success: true,
            data: {
                uploadUrl,
                key,
                imageUrl
            }
        });
    } catch (error) {
        next(error);
    }
}

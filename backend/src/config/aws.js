import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

AWS.config.update({
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3({
    region: process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1',
    signatureVersion: 'v4'
});
const sns = new AWS.SNS();
const cloudwatch = new AWS.CloudWatch();
const cognitoISP = new AWS.CognitoIdentityServiceProvider();

export {
    dynamoDB,
    s3,
    sns,
    cloudwatch,
    cognitoISP
};
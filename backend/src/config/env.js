const requiredEnvVars = [
    'AWS_REGION',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',

    'DYNAMODB_USERS_TABLE',
    'DYNAMODB_TEAMS_TABLE',
    'DYNAMODB_PROJECTS_TABLE',
    'DYNAMODB_TASKS_TABLE',
    'DYNAMODB_COMMENTS_TABLE',
    'DYNAMODB_ACTIVITY_LOG_TABLE',

    'COGNITO_USER_POOL_ID',
    'COGNITO_REGION',

    'SNS_TASK_ASSIGNMENT_TOPIC_ARN',
    'S3_ORIGINALS_BUCKET',
    'S3_RESIZED_BUCKET',

    'BACKEND_PORT',
    'NODE_ENV'
];

export function validateEnv() {
    const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

    if (missingVars.length > 0) {
        console.error('Missing required environment variables:');
        missingVars.forEach((key) => console.error(`- ${key}`));

        process.exit(1);
    }

    console.log('Environment variables validated successfully');
}
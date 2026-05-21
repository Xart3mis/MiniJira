import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const dynamo = DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' })
);
const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION || 'us-east-1' });

const ACTIVITY_LOG_TABLE = process.env.DYNAMODB_ACTIVITY_LOG_TABLE || 'minijira-activity-log';
const CW_NAMESPACE = 'MiniJira/Tasks';

export async function handler(event) {
    for (const record of event.Records) {
        let snsMessage;

        try {
            // SQS body wraps an SNS notification
            const sqsBody = JSON.parse(record.body);
            snsMessage = JSON.parse(sqsBody.Message);
        } catch (err) {
            console.error('Failed to parse SQS/SNS message:', err.message, record.body);
            continue;
        }

        const { taskId, assigneeId, assigneeEmail, teamId, title, eventType } = snsMessage;

        if (eventType !== 'TaskAssigned') {
            console.log(`Ignoring event type: ${eventType}`);
            continue;
        }

        console.log(`Processing assignment for task ${taskId} → assignee ${assigneeId}`);

        // 1. Write activity log entry
        const logEntry = {
            taskId,
            timestamp: new Date().toISOString(),
            action: 'TaskAssigned',
            assigneeId,
            assigneeEmail: assigneeEmail || '',
            teamId: teamId || '',
            title: title || '',
            processedAt: new Date().toISOString()
        };

        try {
            await dynamo.send(new PutCommand({
                TableName: ACTIVITY_LOG_TABLE,
                Item: logEntry
            }));
            console.log(`Activity log written for task ${taskId}`);
        } catch (err) {
            console.error(`Failed to write activity log for task ${taskId}:`, err.message);
        }

        // 2. Publish CloudWatch metric
        try {
            await cloudwatch.send(new PutMetricDataCommand({
                Namespace: CW_NAMESPACE,
                MetricData: [
                    {
                        MetricName: 'TaskAssignments',
                        Value: 1,
                        Unit: 'Count',
                        Dimensions: [
                            { Name: 'TeamId', Value: teamId || 'unknown' }
                        ]
                    }
                ]
            }));
            console.log(`CloudWatch metric published for task ${taskId}`);
        } catch (err) {
            console.error(`Failed to publish CloudWatch metric for task ${taskId}:`, err.message);
        }
    }
}

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamo = DynamoDBDocumentClient.from(
    new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' })
);
const sns = new SNSClient({ region: process.env.AWS_REGION || 'us-east-1' });

const TASKS_TABLE = process.env.DYNAMODB_TASKS_TABLE || 'minijira-tasks';
const DIGEST_TOPIC_ARN = process.env.SNS_DAILY_DIGEST_TOPIC_ARN;

export async function handler(event) {
    console.log('Daily digest Lambda triggered', new Date().toISOString());

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Scan tasks table for tasks due today or overdue (not done)
    let allTasks = [];
    let lastKey;

    do {
        const result = await dynamo.send(new ScanCommand({
            TableName: TASKS_TABLE,
            ExclusiveStartKey: lastKey
        }));
        allTasks = allTasks.concat(result.Items || []);
        lastKey = result.LastEvaluatedKey;
    } while (lastKey);

    const dueTodayTasks = allTasks.filter(task => {
        if (!task.deadline) return false;
        if (task.status === 'Done') return false;
        return task.deadline <= today;
    });

    console.log(`Found ${dueTodayTasks.length} tasks due today or overdue`);

    if (dueTodayTasks.length === 0) {
        console.log('No tasks due today — skipping digest');
        return { statusCode: 200, body: 'No tasks due today' };
    }

    // Build digest email body
    const overdue = dueTodayTasks.filter(t => t.deadline < today);
    const dueToday = dueTodayTasks.filter(t => t.deadline === today);

    const lines = [
        `Mini-Jira Daily Digest — ${today}`,
        '',
        `Tasks due TODAY: ${dueToday.length}`,
        ...dueToday.map(t => `  • [${t.priority}] ${t.title} (assigned to ${t.assigneeName || t.assigneeId})`),
        '',
        `Overdue tasks: ${overdue.length}`,
        ...overdue.map(t => `  • [${t.priority}] ${t.title} — deadline ${t.deadline} (assigned to ${t.assigneeName || t.assigneeId})`),
        '',
        `Total: ${dueTodayTasks.length} tasks need attention.`
    ];

    const messageBody = lines.join('\n');
    console.log('Digest body:\n', messageBody);

    if (!DIGEST_TOPIC_ARN) {
        console.warn('SNS_DAILY_DIGEST_TOPIC_ARN not set — digest built but not sent');
        return { statusCode: 200, body: 'Digest built but SNS topic not configured' };
    }

    await sns.send(new PublishCommand({
        TopicArn: DIGEST_TOPIC_ARN,
        Subject: `Mini-Jira Daily Digest: ${dueTodayTasks.length} tasks need attention`,
        Message: messageBody
    }));

    console.log('Daily digest sent via SNS');
    return { statusCode: 200, body: `Digest sent — ${dueTodayTasks.length} tasks` };
}

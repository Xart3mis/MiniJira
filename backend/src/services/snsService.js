/**
 * snsService.js
 * Publishes task-assignment events to SNS.
 *
 * SNS fan-out:
 *   Topic → (1) Email subscription  → notifies the assignee directly
 *           (2) SQS subscription    → feeds the Assignment Worker Lambda
 */

const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");

const region = process.env.AWS_REGION || "us-east-1";
const ASSIGNMENT_TOPIC_ARN = process.env.SNS_TASK_ASSIGNMENT_TOPIC_ARN;

const sns = new SNSClient({ region });

/**
 * Publish a task-assigned event to SNS.
 *
 * @param {Object} assignment
 * @param {string} assignment.taskId
 * @param {string} assignment.taskTitle
 * @param {string} assignment.taskDescription
 * @param {string} assignment.priority        e.g. "High"
 * @param {string} assignment.deadline        e.g. "2026-05-30"
 * @param {string} assignment.assigneeId
 * @param {string} assignment.assigneeName
 * @param {string} assignment.assigneeEmail
 * @param {string} assignment.managerId
 * @param {string} assignment.managerName
 * @param {string} assignment.teamId
 * @param {string} assignment.teamName
 * @param {string} assignment.projectId
 * @param {string} assignment.projectName
 */
const publishTaskAssigned = async (assignment) => {
  if (!ASSIGNMENT_TOPIC_ARN) {
    throw new Error("SNS_TASK_ASSIGNMENT_TOPIC_ARN environment variable is not set.");
  }

  // Human-readable email body (received by the email subscription)
  const emailBody = [
    `Hi ${assignment.assigneeName},`,
    ``,
    `You have been assigned a new task on Mini-Jira:`,
    ``,
    `  Title      : ${assignment.taskTitle}`,
    `  Description: ${assignment.taskDescription || "—"}`,
    `  Priority   : ${assignment.priority || "Normal"}`,
    `  Deadline   : ${assignment.deadline || "—"}`,
    `  Project    : ${assignment.projectName || assignment.projectId || "—"}`,
    `  Team       : ${assignment.teamName || assignment.teamId || "—"}`,
    `  Assigned by: ${assignment.managerName}`,
    ``,
    `Please log in to Mini-Jira to view the full task details.`,
    ``,
    `— The Mini-Jira Bot`,
  ].join("\n");

  // The JSON payload consumed by the SQS → worker Lambda branch
  const sqsPayload = JSON.stringify({
    ...assignment,
    eventType: "TASK_ASSIGNED",
    timestamp: new Date().toISOString(),
  });

  /**
   * SNS Message Structure:
   * Using "json" format with per-protocol messages so the email subscriber
   * receives a readable body while the SQS subscriber receives the full JSON.
   */
  const messageStructure = "json";
  const message = JSON.stringify({
    default: sqsPayload,   // Fallback (also used by SQS unless overridden)
    email: emailBody,      // Human-readable for email subscribers
    sqs: sqsPayload,       // JSON for the SQS subscriber
  });

  const cmd = new PublishCommand({
    TopicArn: ASSIGNMENT_TOPIC_ARN,
    Subject: `[Mini-Jira] New Task Assigned: ${assignment.taskTitle}`,
    Message: message,
    MessageStructure: messageStructure,
    MessageAttributes: {
      eventType: {
        DataType: "String",
        StringValue: "TASK_ASSIGNED",
      },
      teamId: {
        DataType: "String",
        StringValue: assignment.teamId || "unknown",
      },
      assigneeEmail: {
        DataType: "String",
        StringValue: assignment.assigneeEmail || "unknown",
      },
    },
  });

  const result = await sns.send(cmd);
  console.log(
    `SNS published for taskId=${assignment.taskId}, MessageId=${result.MessageId}`
  );
  return result.MessageId;
};

module.exports = { publishTaskAssigned };

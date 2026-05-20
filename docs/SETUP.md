# Deployment & Setup Guide

## Local Development Setup

### Prerequisites
- Node.js v18+
- npm
- AWS Account (free tier)
- Git

### Step 1: Clone & Install Dependencies

```bash
git clone https://github.com/your-repo/minijira.git
cd minijira
npm run install-all
```

### Step 2: Configure Environment

```bash
cp .env.example .env
# Edit .env with your AWS credentials and settings
```

### Step 3: Start Local Dev Server

```bash
npm run dev
```

This starts:
- **Frontend**: http://localhost:5173 (Vite)
- **Backend**: http://localhost:5000 (Express)

---

## AWS Setup (Critical Path)

### Phase 1: Authentication (Cognito)

1. **Create Cognito User Pool**
   - Go to AWS Cognito console
   - Create user pool named `minijira-users`
   - Add custom attributes: `role` (String), `teamId` (String)
   - Create app client (copy Client ID into `.env`)

2. **Create Test Users**
   - Manager Ali: email=ali@example.com, role=Manager
   - Employee Sara: email=sara@example.com, role=Employee, teamId=team-frontend
   - Employee Omar: email=omar@example.com, role=Employee, teamId=team-backend

3. **Update .env with Cognito details**
   ```
   COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
   COGNITO_CLIENT_ID=your_client_id
   ```

### Phase 2: Database (DynamoDB)

Create the following tables:

#### Users Table
- Primary Key: `userId` (String)
- Attributes: `email`, `name`, `role`, `teamId`, `createdAt`

#### Teams Table
- Primary Key: `teamId` (String)
- Attributes: `name`, `createdAt`

#### Projects Table
- Primary Key: `projectId` (String)
- Sort Key: `createdAt`
- GSI1: `teamId` (Partition Key) — for querying projects by team
- Attributes: `title`, `description`, `teamId`

#### Tasks Table (Most Important)
- Primary Key: `taskId` (String)
- Sort Key: `createdAt`
- **GSI1**: `teamId` (Partition Key), `createdAt` (Sort Key) — for team-scoped queries
- **GSI2**: `assigneeId` (Partition Key), `createdAt` (Sort Key) — for employee's tasks
- Attributes:
  ```
  taskId, projectId, teamId, assigneeId
  title, description, status, priority, deadline
  imageUrl, imageVersions (list)
  createdAt, updatedAt
  ```

#### Comments Table
- Primary Key: `taskId` (String)
- Sort Key: `commentId` (String with UUID)
- Attributes: `authorId`, `text`, `createdAt`

#### ActivityLog Table
- Primary Key: `taskId` (String)
- Sort Key: `timestamp` (ISO 8601)
- Attributes: `userId`, `action`, `oldStatus`, `newStatus`

**Billing**: Select **On-Demand** (no provisioning needed for free tier)

### Phase 3: Storage (S3)

1. **Create S3 Buckets**
   - `minijira-images-originals` (for original uploads)
   - `minijira-images-resized` (for thumbnails)

2. **Enable CORS on originals bucket**
   ```json
   {
     "CORSRules": [
       {
         "AllowedOrigins": ["http://localhost:5173", "https://your-cloudfront-domain"],
         "AllowedMethods": ["GET", "PUT", "POST"],
         "AllowedHeaders": ["*"],
         "MaxAgeSeconds": 3000
       }
     ]
   }
   ```

3. **Enable Versioning**
   - Click "Versioning" on originals bucket
   - Enable (to keep old image versions)

### Phase 4: Messaging (SNS + SQS)

1. **Create SNS Topic**
   - Name: `minijira-task-assignment`
   - Copy ARN into `.env` as `SNS_TOPIC_TASK_ASSIGNMENT`

2. **Create SNS Email Subscription**
   - Topic: `minijira-task-assignment`
   - Protocol: Email
   - Endpoint: your-email@example.com
   - Confirm subscription in your inbox

3. **Create SQS Queue**
   - Name: `minijira-task-assignment`
   - Standard queue
   - Copy URL into `.env` as `SQS_QUEUE_URL`
   - **Visibility timeout**: 300 seconds
   - **Message retention period**: 4 days

4. **Subscribe SQS to SNS**
   - Go to SQS queue
   - "Send message" → "Publish to SNS topic"
   - Topic ARN: (paste from SNS console)

### Phase 5: Lambda Functions

#### Lambda 1: Image Resize

1. Create function `minijira-image-resize`
   - Runtime: Node.js 18.x
   - Handler: `index.handler`

2. Upload code (see `backend/lambda/imageResize/index.js`)

3. Add S3 trigger
   - Bucket: `minijira-images-originals`
   - Event: `s3:ObjectCreated:*`

4. Add layers (dependencies)
   - Upload `sharp` library as Lambda layer

5. Set environment variables
   ```
   RESIZED_BUCKET=minijira-images-resized
   ```

#### Lambda 2: Assignment Worker

1. Create function `minijira-assignment-worker`
   - Runtime: Node.js 18.x
   - Handler: `index.handler`

2. Upload code (see `backend/lambda/assignmentWorker/index.js`)

3. Set SQS trigger
   - Queue: `minijira-task-assignment`
   - Batch size: 10
   - Batch window: 30 seconds

4. Set environment variables
   ```
   DYNAMODB_ACTIVITY_LOG_TABLE=minijira-activity-log
   CLOUDWATCH_NAMESPACE=MiniJira
   ```

#### Lambda 3: Daily Digest

1. Create function `minijira-daily-digest`
   - Runtime: Node.js 18.x
   - Handler: `index.handler`

2. Upload code (see `backend/lambda/dailyDigest/index.js`)

3. Set environment variables
   ```
   SNS_TOPIC_ARN=arn:aws:sns:...
   DYNAMODB_TASKS_TABLE=minijira-tasks
   ```

### Phase 6: EventBridge Scheduler

1. Go to EventBridge → Rules
2. Create rule `minijira-daily-digest-trigger`
   - Schedule: `cron(0 9 * * ? *)` (9 AM daily, UTC)
   - Target: Lambda function `minijira-daily-digest`

### Phase 7: IAM Roles & Permissions

#### EC2 Instance Role
Create IAM role with policies:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:Query",
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:DeleteItem",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:us-east-1:ACCOUNT:table/minijira-*",
        "arn:aws:dynamodb:us-east-1:ACCOUNT:table/minijira-*/index/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::minijira-images-*/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "arn:aws:sns:us-east-1:ACCOUNT:minijira-*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:us-east-1:ACCOUNT:*"
    }
  ]
}
```

#### Lambda Execution Role
Create similar role with Lambda-specific permissions.

---

## Infrastructure Deployment (EC2 + ALB)

### Step 1: Launch EC2 Instances

1. Go to EC2 → Instances → Launch Instance
2. Create 2 instances (one per AZ):
   - **AMI**: Ubuntu 22.04 LTS (free tier)
   - **Instance Type**: t3.micro (free tier) or t3.small
   - **Availability Zone**: us-east-1a (first), us-east-1b (second)
   - **Security Group**: Allow inbound on port 5000 from ALB only
   - **User Data Script**:
   ```bash
   #!/bin/bash
   sudo apt update
   sudo apt install -y nodejs npm
   cd /home/ubuntu
   git clone https://github.com/your-repo/minijira.git
   cd minijira
   npm run install-all
   export NODE_ENV=production
   export AWS_REGION=us-east-1
   npm --prefix backend start
   ```

3. Tag instances: `Name=minijira-backend-1a` and `minijira-backend-1b`

### Step 2: Create Application Load Balancer

1. Go to EC2 → Load Balancers → Create ALB
   - Name: `minijira-alb`
   - Scheme: Internet-facing
   - IP address type: IPv4

2. Network settings:
   - VPC: Default
   - Subnets: Select public subnets in both AZs

3. Security group:
   - Allow inbound 80, 443 from 0.0.0.0/0
   - Allow outbound to EC2 security group on port 5000

4. Create target group:
   - Name: `minijira-targets`
   - Protocol: HTTP
   - Port: 5000
   - Health check path: `/health`
   - Add EC2 instances to target group

5. Listeners:
   - HTTP 80 → Forward to `minijira-targets`

### Step 3: Create Auto Scaling Group

1. Go to EC2 → Auto Scaling Groups → Create ASG
   - Name: `minijira-asg`
   - Launch template: Create new (or use custom AMI)
   - Min capacity: 2
   - Max capacity: 10
   - Desired capacity: 2
   - Target group: `minijira-targets`
   - Health check type: ELB (inherit from ALB)

---

## CloudFront CDN

1. Go to CloudFront → Create distribution
   - Origin domain: ALB DNS name
   - Viewer protocol: HTTPS (redirect HTTP to HTTPS)
   - Cache behaviors:
     - `/api/*` → Don't cache
     - `/static/*` → Cache 24 hours
     - Default → Cache 1 hour

2. SSL/TLS: Use CloudFront certificate or bring your own

3. Copy distribution domain name (e.g., `d123.cloudfront.net`)

4. Update `.env` with CloudFront URL for production

---

## CloudWatch Monitoring

### Create Dashboard

1. Go to CloudWatch → Dashboards → Create dashboard `minijira-monitoring`

2. Add widgets:
   - **Tasks Created Daily**: Custom metric (publish from backend)
   - **Tasks Closed per Team**: Custom metric
   - **Average Time-to-Close**: Calculated from task lifecycle
   - **EC2 CPU Utilization**: Auto-collected
   - **ALB Target Health**: Auto-collected
   - **Lambda Invocations**: Auto-collected

### Create Alarms

1. **Overdue Tasks Alarm**
   - Metric: Custom (BacklogSize)
   - Threshold: > 5
   - Action: Publish to SNS topic

2. **EC2 CPU High**
   - Metric: CPUUtilization
   - Threshold: > 80% for 5 min
   - Action: Trigger ASG scale-up

3. **ALB Unhealthy Targets**
   - Metric: UnHealthyHostCount
   - Threshold: > 0
   - Action: Publish to SNS topic

---

## Deployment Checklist

- [ ] Cognito user pool created + test users
- [ ] DynamoDB tables created (all 5) with GSIs
- [ ] S3 buckets created + CORS enabled + versioning on originals
- [ ] SNS topic + SQS queue created + subscribed
- [ ] Lambda functions deployed (image resize, worker, daily digest)
- [ ] EventBridge rule created (daily 9 AM)
- [ ] IAM roles created + attached to EC2 + Lambda
- [ ] EC2 instances launched (2 across AZs)
- [ ] ALB created + health checks passing
- [ ] ASG created + instances registered
- [ ] CloudFront distribution created
- [ ] CloudWatch dashboard created + alarms set
- [ ] Environment variables set on EC2 instances
- [ ] Backend is accessible via ALB DNS
- [ ] Frontend deployed to CloudFront
- [ ] Test demo scenario (Ali creates tasks, Sara/Omar see theirs only)
- [ ] Architecture diagram created
- [ ] Demo video recorded
- [ ] Submission form filled

---

## Troubleshooting

### EC2 Backend Not Starting
```bash
# SSH into EC2
ssh -i key.pem ubuntu@ec2-instance-ip

# Check logs
cd minijira && npm --prefix backend start
# Look for env var errors, missing packages, etc.
```

### Lambda Not Triggering
```bash
# Go to CloudWatch Logs → Lambda function logs
# Look for error messages, permission issues, etc.
```

### S3 Upload Failing
```bash
# Check CORS configuration on bucket
# Check presigned URL expiration (default 15 min)
# Check bucket permissions in IAM role
```

### DynamoDB Query Slow
```bash
# Check GSI usage in queries
# Add logging to backend to see query times
# Monitor CloudWatch metrics: ConsumedReadCapacity
```

### Cognito Token Invalid
```bash
# Verify JWT signature matches user pool
# Check token expiration
# Ensure custom attributes (role, teamId) are present
```

---

## Cost Monitoring

1. Go to AWS Billing → Cost Explorer
2. Filter by service (EC2, DynamoDB, S3, Lambda, etc.)
3. Set monthly budget alerts

**Free Tier Limits:**
- EC2: 750 hrs/month (stop when not using)
- EBS: 30 GB total (watch instance sizes)
- ALB: 750 hrs/month
- DynamoDB: 25 GB free; on-demand pricing after
- Lambda: 1M requests, 400K GB-seconds free
- S3: 5 GB free tier

---

## Post-Deployment

1. **Test demo scenario** on live CloudFront URL
2. **Record demo video** (screen + audio)
3. **Create architecture diagram** (Lucidchart/Draw.io)
4. **Fill submission form**
5. **STOP (don't terminate) resources** after submission
6. Keep running for grading/review if needed

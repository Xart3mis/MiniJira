# Mini-Jira on AWS

A lightweight team task-management application (think Jira/Trello) built with MERN and deployed on AWS.

**Deadline:** May 22, 2026 at 11:59 PM  
**Team:** 5 people  
**Stack:** React (frontend) + Express.js (backend) + DynamoDB (data) + AWS services

## Quick Start

### Prerequisites
- Node.js v18+
- AWS Account with free tier (EC2, DynamoDB, S3, Lambda, etc.)
- Git

### Setup
```bash
# Install dependencies
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# Copy environment files
cp .env.example .env
cp backend/.env.example backend/.env

# Start local development
npm run dev  # Runs both frontend and backend concurrently
```

## Project Structure

```
MiniJira/
├── frontend/              # React + Vite
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API calls
│   │   ├── context/       # Auth/team context
│   │   ├── utils/         # Helpers
│   │   └── App.jsx
│   └── package.json
├── backend/               # Express.js
│   ├── src/
│   │   ├── controllers/   # API logic
│   │   ├── models/        # DynamoDB schemas
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Auth, validation
│   │   ├── services/      # Business logic
│   │   ├── config/        # AWS SDK setup
│   │   └── server.js
│   ├── lambda/            # AWS Lambda functions
│   │   ├── imageResize/
│   │   ├── assignmentWorker/
│   │   └── dailyDigest/
│   └── package.json
├── infrastructure/        # IaC and AWS configs
├── docs/                  # Documentation
└── CLAUDE.md             # Project context for Claude
```

## Team Assignments

| Role | Focus Area | Key Tasks |
|------|-----------|-----------|
| **Person 1** | Frontend Core | Auth pages, Dashboard, Kanban board layout |
| **Person 2** | Frontend Features | Task modal, Comments, File upload UI |
| **Person 3** | Backend API | User/Team/Task routes, DynamoDB models, Cognito integration |
| **Person 4** | Backend Services | S3 upload handling, SNS/SQS setup, Lambda integration |
| **Person 5** (You) | DevOps + Integration | EC2/ALB/CloudFront setup, Terraform IaC, CI/CD, final deployment |

## Key Files

- **CLAUDE.md** — Project context, architecture decisions, coding standards
- **docs/ARCHITECTURE.md** — AWS architecture diagram and explanation
- **docs/API.md** — Backend API specification
- **docs/SETUP.md** — Detailed setup and deployment guide

## Critical Reminders

⚠️ **AWS Free Tier Limits:**
- EC2: 750 hours/month (stop when not using)
- EBS: 30GB max
- ALB/DynamoDB: Monitor usage
- **Always STOP (don't terminate) resources after testing**

## Next Steps

1. Clone this repo and set up locally
2. Read **CLAUDE.md** for coding standards and context
3. Read **docs/ARCHITECTURE.md** for system design
4. Divide work by person/component
5. Use GitHub issues/PRs for collaboration
6. Daily standup on progress

See CLAUDE.md for more details.

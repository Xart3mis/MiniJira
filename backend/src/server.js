import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

import { validateEnv } from './config/env.js';

import taskRoutes from './routes/taskRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import teamRoutes from './routes/teamRoutes.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();
validateEnv();

const app = express();
const PORT = process.env.BACKEND_PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.REACT_APP_FRONTEND_URL
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend/dist')));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Mini-Jira backend is running',
    health: '/health',
    tasks: '/api/tasks'
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/tasks', taskRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);

  if (err.code === 'ResourceNotFoundException') {
    return res.status(500).json({
      success: false,
      error: 'DynamoDBResourceNotFound',
      message: 'A required DynamoDB table or index was not found. Check table name, index name, and AWS region.'
    });
  }

  if (err.code === 'UnrecognizedClientException') {
    return res.status(500).json({
      success: false,
      error: 'AWSCredentialsError',
      message: 'AWS credentials are invalid or expired. Check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY.'
    });
  }

  if (err.code === 'AccessDeniedException') {
    return res.status(403).json({
      success: false,
      error: 'AWSAccessDenied',
      message: 'AWS user does not have permission for this action.'
    });
  }

  if (err.code === 'ValidationException') {
    return res.status(400).json({
      success: false,
      error: 'DynamoDBValidationException',
      message: err.message
    });
  }

  if (err.code === 'ConditionalCheckFailedException') {
    return res.status(409).json({
      success: false,
      error: 'ConditionalCheckFailed',
      message: 'The requested operation could not be completed because a condition failed.'
    });
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.name || err.code || 'ServerError',
    message: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'NotFound',
    message: `Route not found: ${req.method} ${req.path}`
  });
});

app.listen(PORT, () => {
  console.log(`[${new Date().toISOString()}] Mini-Jira backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`AWS Region: ${process.env.AWS_REGION}`);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist', 'index.html'));
});


export default app;

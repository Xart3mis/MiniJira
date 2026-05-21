# Mini-Jira Backend Progress

## Completed

### Server Setup
- Express server configured
- CORS enabled
- Morgan logging enabled
- JSON body parsing enabled
- Health check endpoint added
- 404 handler added
- Global error handler added
- Environment variable validation added

### DynamoDB
- DynamoDB helper functions created
- Users table connected
- Teams table connected
- Projects table connected
- Tasks table connected
- Comments table connected

### APIs
- User CRUD implemented
- Team CRUD implemented
- Project CRUD implemented
- Task CRUD implemented
- Comment CRUD implemented
- Nested task comment routes implemented

### Validation
- User teamId validation
- Project teamId validation
- Task teamId/projectId/assigneeId validation
- Comment taskId validation
- Role validation
- Task priority/status validation
- Email format validation
- Duplicate email prevention

### Safe Delete Rules
- Team delete blocked if used by users/projects/tasks
- Project delete blocked if used by tasks
- User delete blocked if assigned to tasks
- Task delete cascades and deletes related comments

## Not Completed Yet

### Authentication
- Cognito JWT validation not added yet
- Real role-based access still uses query params for testing
- Team isolation still uses query params for testing

## Temporary Testing Notes

Until Cognito is connected, role/team testing uses query parameters:

- Manager: `?role=Manager`
- Employee: `?role=Employee&teamId=TEAM_ID`
- User self-check: `?role=Employee&requesterId=USER_ID`
---
name: deploy-lambda
description: Package and deploy a Lambda function. Args: function name (imageResize | assignmentWorker | dailyDigest)
---

## Deploy Lambda

The function name is provided in the skill args. Valid values: `imageResize`, `assignmentWorker`, `dailyDigest`.

Steps:

1. Resolve the function directory: `backend/lambda/<name>`
2. If a `package.json` exists in that directory, run `npm install --omit=dev` inside it to install production deps only.
3. Zip the directory contents (not the parent folder):
   ```bash
   cd /home/sico/Code/MiniJira/backend/lambda/<name>
   zip -r /tmp/<name>.zip .
   ```
4. Deploy the zip to AWS Lambda:
   ```bash
   aws lambda update-function-code \
     --function-name <name> \
     --zip-file fileb:///tmp/<name>.zip
   ```
5. Wait for the update to finish:
   ```bash
   aws lambda wait function-updated --function-name <name>
   ```
6. Fetch and display the updated function config to confirm success:
   ```bash
   aws lambda get-function-configuration --function-name <name> \
     --query '{CodeSize:CodeSize,LastModified:LastModified,State:State}' \
     --output table
   ```

Report the `CodeSize`, `LastModified`, and `State` values back to the user. If any step fails, show the error and stop.

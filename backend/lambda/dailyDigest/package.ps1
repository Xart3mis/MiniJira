. "$PSScriptRoot\..\_lambda-pack.ps1"
Pack-Lambda -LambdaDir $PSScriptRoot -FunctionName 'minijira-daily-digest' -EnvHint 'Env: DYNAMODB_TASKS_TABLE, SNS_DAILY_DIGEST_TOPIC_ARN'

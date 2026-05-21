. "$PSScriptRoot\..\_lambda-pack.ps1"
Pack-Lambda -LambdaDir $PSScriptRoot -FunctionName 'minijira-assignment-worker' -EnvHint 'Env: DYNAMODB_ACTIVITY_LOG_TABLE, CLOUDWATCH_NAMESPACE'

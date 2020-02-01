# Lambda Subscriber

This directory provides a sample
[AWS Lambda function](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
that processes audit events sent to AWS Simple Notification Services (SNS).
It is triggered by the audit event and stores it in a
[DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html)
table.
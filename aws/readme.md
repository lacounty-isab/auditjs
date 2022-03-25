# Lambda Subscriber

This directory provides a sample
[AWS Lambda function](https://docs.aws.amazon.com/lambda/latest/dg/welcome.html)
that processes audit events sent to AWS Simple Notification Services (SNS).
It is triggered by the audit event and stores the event in a
[DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Introduction.html)
table.

The sample has been updated to use the
[AWS SDK for JavaScript Version 3](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/welcome.html).
It has also been converted to an `async` function.
It catches and handles any exceptions.  An alternative
is to remove the `try ... catch` block and let the
AWS Lambda runtime catch any exception.  This would be
preferred if a dead-letter queue is configured for
errors.

**Note**: The AWS V3 API is not included with the JavaScript
Lambda runtime by default.  You must define a Lambda layer
with the required dependencies.
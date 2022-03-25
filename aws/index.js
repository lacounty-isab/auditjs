console.log('Loading function');
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');
const addItem = {
  TableName: 'development.audit',
  ConditionExpression: 'attribute_not_exists(id)'
};

// eslint-disable-next-line no-unused-vars
exports.handler = async (event, context) => {
  const jsonStr = event.Records[0].Sns.Message;
  const auditObj = JSON.parse(jsonStr);
  // eslint-disable-next-line no-unused-vars
  const auditStr = `
   Audit ID: ${auditObj.id}
     Status: ${auditObj.status}
  Component: ${auditObj.component}
     Action: ${auditObj.action}
     Fields: ${auditObj.fields}
`;

  try {
    addItem.Item = marshall(auditObj);
    const dbClient = new DynamoDBClient();
    const cmd = new PutItemCommand(addItem);
    await dbClient.send(cmd);
    console.log(`Put audit item ${auditObj.id}`);
  } catch (err) {
    console.error(`DynamoDB put problem: ${JSON.stringify(err, null, 2)}`);
  }
};

console.log('Loading function');
const { DynamoDB } = require('aws-sdk');
const addItem = {
  TableName: 'development.audit',
  ConditionExpression: 'attribute_not_exists(id)'
};

exports.handler = (event, context, callback) => {
  // console.log('Received event:', JSON.stringify(event, null, 2));
  const jsonStr = event.Records[0].Sns.Message;
  const auditObj = JSON.parse(jsonStr);
  const auditStr = `
   Audit ID: ${auditObj.id}
     Status: ${auditObj.status}
  Component: ${auditObj.component}
     Action: ${auditObj.action}
     Fields: ${auditObj.fields}
`;
  addItem.Item = auditObj;

  const doc = new DynamoDB.DocumentClient();
  doc.put(addItem, (err, data) => {
    if (err) {
      console.log("DynamoDB put problem:", JSON.stringify(err, null, 2));
      callback(err);
    } else {
      console.log('Put audit item', auditObj.id);
      callback(null, '');
    }
  });
};

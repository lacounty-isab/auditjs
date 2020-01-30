const ConsoleAudit = require('./npmpkg/ConsoleAudit');

// Returns an instance of an Audit subclass.
// Outside of testing, probably not what the user wants.
//
const record = (options = { emitter: 'console' }) => {
  let audit = null;
  switch (options.emitter) {
    case 'console':
    default:
      console.log('Configuring console emiter.');
      audit = new ConsoleAudit.ConsoleAudit();
  }
  return audit;
} 

// Returns an Express middleware handler to be inserted
// into the call chain (ideally before the main method.
//
const middleware = (options = { emitter: 'console' }) => {
  let handler = null;
  if (!options.responseHeader) {
    console.log('Warning: Response header not configured for audit module.');
    console.log('API responses will not contain request ID.');
  }
  switch (options.emitter) {
    case 'awssns':
      console.log('Configuring AWS SNS handler from options');
      if (options.awsRegion) {
        console.log('\tawsRegion=', options.awsRegion);
      } else {
        console.log('AWS SNS options missing "awsRegion"');
        break;
      }
      if (options.awsTopicArn) {
        console.log('\tawsTopicArn=', options.awsTopicArn)
      } else {
        console.log('AWS SNS option missing "awsTopicArn"');
        break;
      }
      if (options.awsKeyId) {
        console.log('\tawsKeyId=', options.awsKeyId);
      } else {
        console.log('AWS SNS option missing "awsKeyId"');
        break;
      }
      if (options.awsSecret) {
        console.log('\tawsSecret=**********');
      } else {
        console.log('AWS SNS option missing "awsSecret"');
        break;
      }
      const AWS = require('aws-sdk');
      const SnsAudit = require('./npmpkg/SnsAudit');
      const snsConfig = { region: options.awsRegion,
                          apiVersion: '2010-03-31' }
      snsConfig.credentials = new AWS.Credentials(options.awsKeyId, options.awsSecret);
      snsConfig.params = { TopicArn: options.awsTopicArn };
      sns = new AWS.SNS(snsConfig);
      handler = SnsAudit.middleware(sns, options.awsTopicArn, options.responseHeader);
      break;
    case 'console':
    default:
      console.log('Configuring console handler.');
      handler = ConsoleAudit.middleware(options.responseHeader);
  }
  if (handler === null) {
    console.error('Audit handler not configured with provided options.');
    console.error('Configuring console logger by default')
    handler = ConsoleAudit.middleware(options.responseHeader);
  }
  return handler;
}

module.exports = { record, middleware }

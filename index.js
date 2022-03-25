const { defaultProvider } = require('@aws-sdk/credential-provider-node');
const { SNSClient } = require('@aws-sdk/client-sns');
const ConsoleAudit = require('./npmpkg/ConsoleAudit');

// Returns an instance of a ConsoleAudit.
// Outside of testing, probably not what the user wants.
//
const instance = (options = { emitter: 'console' }) => {
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
  if (!options.emitter) {
    options.emitter = 'console';
  }
  const quietInit = !!options.quietInit;
  const quietEmit = !!options.quietEmit;
  if (!options.responseHeader) {
    console.log('Warning: Response header not configured for audit module.');
    console.log('API responses will not contain request ID.');
  }
  switch (options.emitter) {
    case 'awssns':
      if (!quietInit) {
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
      }
      const SnsAudit = require('./npmpkg/SnsAudit');
      const snsConfig = { region: options.awsRegion,
                          credentials: defaultProvider() };
      const snsClient = new SNSClient(snsConfig);
      handler = SnsAudit.middleware(snsClient, options.awsTopicArn, options.responseHeader, quietEmit);
      break;
    case 'console':
    default:
      quietInit || console.log('Configuring console handler.');
      handler = ConsoleAudit.middleware(options.responseHeader);
  }
  if (handler === null) {
    console.error('Audit handler not configured with provided options.');
    console.error('Configuring console logger by default')
    handler = ConsoleAudit.middleware(options.responseHeader);
  }
  return handler;
}

module.exports = { instance, middleware }

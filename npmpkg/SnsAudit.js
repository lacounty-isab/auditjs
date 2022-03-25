const { Audit } = require('./Audit');
const { PublishCommand } = require('@aws-sdk/client-sns');

class SnsAudit extends Audit {
  // Input is a configured instances of require('@aws-sdk/client-sns').SNSClient;
  constructor(sns, topic, quietEmit) {
    super();
    this.snsClient = sns;
    this.topic = topic;
    this.quietEmit = quietEmit;
  }

  async end() {
    super.end();
    const entry = {'id': this.uuid };
    entry['start_time'] = this.startTime.toISO();
    entry['end_time']   = this.endTime.toISO();
    entry['duration']   = this.duration;
    entry['status']     = this.status;
    entry['component']  = this.component;
    entry['action']     = this.action;
    entry['token']      = this.missingToken ? 'missing' : this.invalidToken ? 'invalid' : 'valid';
    entry['client_ip']  = this.ip;
    entry['client_id']  = this.claims.sub;
    entry['issuer_id']  = this.claims.iss;
    entry['fields']     = this.fields;
    entry['claims']     = this.claims;
    entry['errors']     = this.errors;

    try {
      const auditStr = JSON.stringify(entry);
      const publishCmd = new PublishCommand({ TopicArn: this.topic, Message: auditStr });
      const response = await this.snsClient.send(publishCmd);
      this.quietEmit || console.log('Request ID:', this.uuid, ', SNS Message ID:', response.MessageId);
    } catch (err) {
      console.error('Failed to send SNS audit notification for Request ID:', this.uuid);
      console.error(err.message);
    }
  }
}

const middleware = (sns, topic, resHeaderName, quietEmit) => {
  return (req, res, next) => {
    const audit = new SnsAudit(sns, topic, quietEmit);
    audit.ip = req.ip;
    audit.action = req.method;
    audit.component = req.path;
    audit.fields = req.body;
    req.audit = audit;
    if (resHeaderName) {
      res.set(resHeaderName, audit.uuid);
    }
    next();
  }
}

module.exports = { middleware }; 
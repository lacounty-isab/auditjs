const { Audit } = require('./Audit');

class SnsAudit extends Audit {
  // Input is a configured instances of require('aws-sdk').SNS();
  constructor(sns, quietEmit) {
    super();
    this.sns = sns;
    this.quietEmit = quietEmit;
  }

  end() {
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

    const auditStr = JSON.stringify(entry);
    const auditParams = { Message: auditStr };
    this.sns.publish(auditParams, (err, data) => {
      if (err) {
        console.error('Failed to send SNS audit notification for Request ID:', this.uuid);
        console.error(err.message);
      } else {
        this.quietEmit || console.log('Request ID:', this.uuid, ', SNS Message ID:', data.MessageId);
      }
    })
  }
}

const middleware = (sns, topic, resHeaderName, quietEmit) => {
  return (req, res, next) => {
    const audit = new SnsAudit(sns, quietEmit);
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
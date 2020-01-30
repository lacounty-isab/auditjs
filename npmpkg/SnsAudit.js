const { Audit } = require('./Audit');

class SnsAudit extends Audit {
  // Input is a configured instances of require('aws-sdk').SNS();
  constructor(sns) {
    super();
    this.sns = sns;
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
    entry['client_ip']  = this.ip;
    entry['client_id']  = this.claims.sub;
    entry['claims']     = JSON.stringify(this.claims);
    entry['errors']     = JSON.stringify(this.errors);

    const auditStr = JSON.stringify(entry);
    const auditParams = { Message: auditStr };
    this.sns.publish(auditParams, (err, data) => {
      if (err) {
        console.error('Failed to send SNS audit notification');
        console.error(err.message);
      } else {
        console.log('SNS audit notification sent.  Message ID:', data.MessageId);
      }
    })
  }
}

const middleware = (sns, topic, resHeaderName) => {
  return (req, res, next) => {
    const audit = new SnsAudit(sns, topic);
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
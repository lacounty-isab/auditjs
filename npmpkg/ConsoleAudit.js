const { Audit, middleware } = require('./Audit');

class ConsoleAudit extends Audit {
  end() {
    super.end();
    const entry = `------ Start request ID ${this.uuid} ----------
 Start time: ${this.startTime.toISO()}
   End time: ${this.endTime.toISO()}
   Duration: ${this.msDuration} ms
HTTP Status: ${this.status}
  Component: ${this.component}
     Action: ${this.action}
 Auth Token: ${this.missingToken ? 'missing' : this.invalidToken ? 'invalid' : 'valid'}
  Client IP: ${this.ip}
  Client ID: ${this.claims.sub}
  Issuer ID: ${this.claims.iss}
     Fields: ${JSON.stringify(this.fields)}
     Claims: ${JSON.stringify(this.claims)}
     Errors: ${JSON.stringify(this.errors)}
------ End request ID ${this.uuid} ------------`
    console.log(entry);
  }
}

module.exports = {
  ConsoleAudit,
  middleware: middleware.bind(null, ConsoleAudit)
}

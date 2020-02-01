// This class implements all the audit methods.
// But it doesn't generate any output.
// Subclasses can generate the output.

const uuid = require('uuid/v1');
const { DateTime, Interval }= require('luxon');

class Audit {
  constructor() {
    this.startTime = DateTime.utc();
    this.endTime = 0;
    this.msDuration = 0;
    this.uuid  = uuid();
    this.status = 0;
    this.component = '';
    this.action = '';
    this.fields = {};
    this.claims = {};
    this.ip = '';
    this.missingToken = true;
    this.invalidToken = true;
    this.done = false;
    this.errors = [];
  }

  start() {
    this.startTime = DateTime.utc();
  }
  
  end() {
    this.done = true;
    this.endTime = DateTime.utc();
    this.msDuration = Interval.fromDateTimes(this.startTime, this.endTime).length();
  }
}

// This is a convenience method for subclasses to use to
// export a middleware function with default setup.
// For anything more involved, the subclass should export
// its own middleware function.
//
// The default behavior is to instantiate the Recorder
// object (an Audit subclass), populate the certain audit
// attributes from the request, and optionally set a
// response header element to the uuid.
//
const middleware = (Recorder, resHeaderName) => {
  return (req, res, next) => {
    const audit = new Recorder();
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

module.exports = { Audit, middleware }
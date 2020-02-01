# Audit for Node.js/Express APIs

This package provides an
[Express middleware](https://expressjs.com/en/guide/writing-middleware.html)
audit framework.  It's a *framework* in the sense that it may be extended to
provde additional audit log destinations.  The package includes two destinations:

1. **Console** - audit entries are sent to `stdout` via `console.log`.

2. **AWS SNS** - audit entries are published to a topic managed by
   [AWS Simple Notification Service](https://docs.aws.amazon.com/sns/latest/dg/welcome.html)
   (SNS).


## Contents

* [Summary](summary)
* [Quick Start](quick-start)
* [Options](options)
* [Usage](usage)
* Extending


## Summary

As an *Express middleware* package, it's intended to be incorporated through an Express
route in a manner like the following sample.

```
1  const audit = require('@isab/audit).middleware(options);
   ...
2  router.post('/MyResource',
3    cors(corsOptions),
4    audit,
5    authenticator.verifyBearer,
6    authorizeScope,
7    requestHandler );
```

The point of including so many middleware components is simply to demonstrate the intended
order.  The numbered descriptions below relate to the line numbers above.

1. An `audit` middleware instance is configured through a set of properties.  Without
   properties provided, a `console` audit is configured.
2. This is the usual method and resource name specified on an
   [Express route](https://expressjs.com/en/guide/routing.html).
3. If your route supports CORS, it should come **before** the audit middleware.
4. The **audit** middleware should come early in the chain to make it available to other
   middleware and the request handler.  This step will add an `audit` property to the
   `Request` object.
5. Authentication middleware (just a sample).
6. Authorization middleware (just a sample).
7. The request handler.


## Quick Start

A quick configuration can be obtained with the following Express application
that simply returns `OK`.  In this example we configure a response header
`MyApp` that will return the request ID.

```
const express = require('express');
const audit   = require('@isab/audit').middleware({responseHeader: "MyApp"});
const app = express();
const port = 6014;

app.get('/', audit, (req, res) => {
  req.audit.end();
  res.status(200).end('OK\n');
});

app.listen(port, () => console.log('Listening on', port));
```

The output from a `curl` invocation shows the `MyApp` response header
holding the request ID.

```
$ curl http://localhost:6014/ -i
HTTP/1.1 200 OK
X-Powered-By: Express
MyApp: cae53940-44b9-11ea-b41c-13705bcb6937
Date: Sat, 01 Feb 2020 06:12:15 GMT
Connection: keep-alive
Content-Length: 3

OK
```

The output in the Express `stdout` will be sandwiched between two
displays of the request ID .

```
$ node minimalApp
Configuring console handler.
Listening on 6014
------ Start request ID cae53940-44b9-11ea-b41c-13705bcb6937 ----------
 Start time: 2020-02-01T06:12:15.178Z
   End time: 2020-02-01T06:12:15.190Z
   Duration: 12 ms
HTTP Status: 0
  Component: /
     Action: GET
 Auth Token: present and valid
  Client IP: ::1
  Client ID: undefined
  Issuer ID: undefined
     Fields: undefined
     Claims: {}
     Errors: []
------ End request ID cae53940-44b9-11ea-b41c-13705bcb6937 ------------
```

Most of the fields are empty or undefined.  In practice, these are populated
within the request handlers are described below.  Only a few fields are 
populated automatically.


## Options

The following properties apply to all destinations.

| Property         | Value                               | Default   |
|------------------|-------------------------------------|-----------|
| `emitter`        | `console` or `awssns`               | `console` |
| `responseHeader` | Response header name for request ID | none      |

If `responseHeader` is not included in the options object, no response header 
is added to the response by the audit middleware.

These additiona properties apply to AWS Simple Notification Services.
They are ignored when `emitter` is `console`.

| Property      | Value                        |
|---------------|------------------------------|
| `awsRegion`   | Region for AWS SNS           |
| `awsTopicArn` | Topic ARN for AWS SNS        |
| `awsKeyId`    | API key for AWS user role    |
| `awsSecret`   | API secret for AWS user role |


It is suggested that desired value be provided through environment variables.
The following sample demonstrates the configuration of an SNS audit middleware
from the environment.

```
const emitter        = process.env['AUDIT_EMITTER'] || 'console';
const responseHeader = process.env['AUDIT_RESPONSE_HEADER'] || 'x-request-idp';
console.log('Audit config:', emitter);
const auditOptions = { emitter, responseHeader };
if (emitter === 'awssns') {
  auditOptions.awsRegion   = process.env['AUDIT_AWS_REGION'];
  auditOptions.awsTopicArn = process.env['AUDIT_AWS_TOPIC'];
  auditOptions.awsKeyId    = process.env['AUDIT_AWS_KEY'];
  auditOptions.awsSecret   = process.env['AUDIT_AWS_SECRET'];
}
const auditMiddleware = Audit.middleware(auditOptions);
```

The middleware will echo the configuration to `stdout`.  It will not divulge
an `awsSecret` property, only whether it is set.


## Usage

Configuring audit middleware is easy.  Using it soundly in your request handler
code requires more work.  Two principals to keep in mind while writing your
request handler are

* An `audit` property on the `Request` object contains the audit instance.

* The request handler **must** call `audit.end()` before exiting the handler,
  otherwise the record is never emitted.

This latter can be difficult to accommodate in the presence of multiple
(often asynchronous) code paths for a request handler.


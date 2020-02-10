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
* [Extensions](extensions)

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

app.get('/test', audit, (req, res) => {
  req.audit.end();
  req.audit.status = 200;
  res.status(200).end('OK\n');
});

app.listen(port, () => console.log('Listening on', port));
```

The output from a `curl` invocation shows the `MyApp` response header
holding the request ID.

```
$ curl http://localhost:6014/test -i
HTTP/1.1 200 OK
X-Powered-By: Express
MyApp: ee49ed90-4603-11ea-9621-77baedfd4eb4
Date: Sun, 02 Feb 2020 21:35:28 GMT
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
------ Start request ID ee49ed90-4603-11ea-9621-77baedfd4eb4 ----------
 Start time: 2020-02-02T21:35:28.483Z
   End time: 2020-02-02T21:35:28.491Z
   Duration: 8 ms
HTTP Status: 200
  Component: /test
     Action: GET
 Auth Token: missing
  Client IP: ::1
  Client ID: undefined
  Issuer ID: undefined
     Fields: undefined
     Claims: {}
     Errors: []
------ End request ID ee49ed90-4603-11ea-9621-77baedfd4eb4 ------------
```

Most of the fields are empty or undefined.  In practice, these are populated
within the request handlers as described below.  Only a few fields are 
populated automatically.


## Options

The following properties apply to all destinations.

| Property         | Value                               | Default   |
|------------------|-------------------------------------|-----------|
| `emitter`        | `console` or `awssns`               | `console` |
| `responseHeader` | Response header name for request ID | none      |
| `quietInit`      | `true` = suppress init logging      | `false`   |
| `quietEmit`      | `true` = suppress emit logging      | `false`   |

If `responseHeader` is not included in the options object, no response header 
is added to the response by the audit middleware.

The configuration is echoed to `stdout` when the module is initialized.
This may be suppressed with `quietInit: true`.  Most emitters will log
a summary of each emit.  Set `quietEmit: true` to suppress this.
The `console` audit ignores this last flag.

These additional properties apply to AWS Simple Notification Services.
They are ignored when `emitter` is `console`.

| Property      | Value                        |
|---------------|------------------------------|
| `awsRegion`   | Region for AWS SNS           |
| `awsTopicArn` | Topic ARN for AWS SNS        |
| `awsKeyId`    | API key for AWS user role    |
| `awsSecret`   | API secret for AWS user role |


It is suggested that desired values be provided through environment variables.
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
requires more work.  Two principles to keep in mind while writing your
request handler are

* An `audit` property on the `Request` object contains the audit instance.

* The request handler **must** call `audit.end()` before exiting the handler,
  otherwise the record is never emitted.

This latter can be difficult to accommodate in the presence of multiple
(often asynchronous) code paths for a request handler.  The following is
an example of a callback passed to a database library.  It has the typical
signature of an error and a data object.

```
 1  const audit = req.audit;
    ...
 2  if (err) {
 3     response = {
 4        code: err.code,
 5        errno: err.errno,
 6        sqlMessage: err.sqlMessage ? err.sqlMessage.slice(0, 60) : 'None'
 7     }
 8     dbErrorLogger(err);
 9     res.status(500);
10     audit.status = 500;
11     audit.errors.push(err.code);
12     audit.errors.push(err.sqlMessage);
13  } else {
14     response.insertId = results.insertId;
15     res.status(200);
16     audit.status = 200;
17  }
18  res.json(response);
19  audit.end();
```

Lines 9 and 15 show the setting of the HTTP status code on the audit object.
Lines 11 and 12 demonstrate that error messages are *pushed* onto the error
array.
Line 19 invokes `end()`.
There will typically be a call to `end()` at the end of each asynchronous 
code path.  This is not simply something that can be cleaned up at the end
of the current event loop.

## Extensions

One can easily extend the `Audit` class to customize your own output (in the
case of the `Console`) or a different audit destination.  Each extension module
exports

* `middleware` - the `(req, res, next)` function that provides the middleware
* the class itself

Only the first is strictly necessary.  Normal usage of the the audit doesn't
involve direct access to the `Audit` subclass.  But it can be useful for
unit testing.

For extension samples, check the following classes in the GitHub repository:

* [ConsoleAudit](https://github.com/lacounty-isab/auditjs/blob/master/npmpkg/ConsoleAudit.js)
* [SnsAudit](https://github.com/lacounty-isab/auditjs/blob/master/npmpkg/SnsAudit.js)

For a sample of processing SNS events from `SnsAudit`, see the Lambda function in
the `aws` folder.
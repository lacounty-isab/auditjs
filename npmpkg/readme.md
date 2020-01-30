Audit Middleware
----------------

This directory is 
[Express middleware](http://expressjs.com/en/guide/writing-middleware.html)
that provides a request audit framework.  An *audit log* has some characteristics
of an *application log*.  But there are some notable differences.

1. **Developers** are the consumer's of an application log; the **business** is the
   consumer of the audit log.  It's conceivable that the audit log could be the
   subject of a legal subpoena for abuse of privileged access.

2. Application logging is performed on a **best effort** basis.  Failure of the
   application to issue a log entry is not, generally speaking, fatal to a
   transaction. Audit records are an **integral part** of the transaction.
   Failure to write an audit record results in a failure of the overall
   transaction.  In other words, unaudited transactions are prohibited.

3. Application log entries are typically issued **independently** of other
   application functions.
   Audit entries are typically **scoped to a transaction** and grouped
   with other information about the transaction.

The principal purpose of the audit log is to record *who* did *what when*.
An unauthenticated request generally doesn't warrant an audit record.
Since CJIS tables are available for unauthenticated queries, these are
not audited.  Only *updates*, *adds*, and *deletes* are audited.


## The Code

The `Audit` base class provides the attributes of an audit record.
The `Audit.js` exports the base class code and the *Express middleware*
function named `middleware`.  The `middleware` function creates a new
audit record in memory based on HTTP `req` attributes.  The `Audit`
base class does not itself *emit* audit records.  That's the job of
a subclass.

The `ConsoleAudit` class extends `Audit` by emitting records via
`console.log`.  This is only suitable for development and test environments.
Staging and production should provide a database solution.


## Usage

All add, update, and delete **Express** routes should have the audit
middleware as the second element in the execution chain.  For example:

```
router.put('/MyResource',
  cors(corsOptions),
  audit,
  authenticator.verifyBearer,
  authorizeScope,
  requestHandler
);
```

It's important to note that
**the Authenticator will abort the request if the audit context is missing.**
Moreover, update, add, and delete operations are coded with the expectation
that the audit context is part of the request object.  If missing,
these operations will fail with `undefined` reference errors.
So it's imperative to include the `audit` middleware **before** the 
`authenticator` middleware.

Within request handlers, the audit context is available from the request
object as the `audit` attribute.  It will have been initialized before
the request handler from previous middleware execution steps.  The
operation is expected to populate the following fields.

* `status` - the HTTP status code of the result
* `errors` - an array of error strings

The `status` is simply an integer attribute.  Error messages may be *pushed*
on the the `errors` array as in `audit.errors.push('some message')`.  When
a request completes, the `end` function should be invoked.

```
audit.end();
```

The `end` method sets the ending timestamp and persists the entry.

const AuditConfig = require('../index');

const consoleOptions = {
  emitter: 'console',
  responseHeader: 'TestApp'
}
const snsOptions = {
  emitter: 'awssns',
  responseHeader: 'TestApp',
  topic: 'audit.development',
  region: 'us-west-1',
  awsKeyId: "abcdef",
  awsSecret: "123456"
}

let req, res, next;

const ip = '127.0.0.1'
const method = 'POST';
const path   = '/p1/p2';
const body   = { field1: 'value1',
                 field2: 'value2' };

beforeEach(() => {
  req = { ip, method, path, body };
  res = { set: jest.fn() };
  next = jest.fn();
});

describe('After Express invokes audit middleware', () => {
  test('audit should be a request attribute', () => {
    const audit = AuditConfig.middleware(consoleOptions);
    audit(req, res, next);
    expect(req.audit).not.toBeNull();
  });

  test('ip should be set on audit object', () => {
    const audit = AuditConfig.middleware(consoleOptions);
    audit(req, res, next);
    expect(req.audit.ip).toBe(ip);
  });

  test('action should be set to HTTP method', () => {
    const audit = AuditConfig.middleware(consoleOptions);
    audit(req, res, next);
    expect(req.audit.action).toBe(method);
  });

  test('component should be set to URL path', () => {
    const audit = AuditConfig.middleware(consoleOptions);
    audit(req, res, next);
    expect(req.audit.component).toBe(path);
  });

  test('fields should be set to body', () => {
    const audit = AuditConfig.middleware(consoleOptions);
    audit(req, res, next);
    expect(req.audit.fields).toMatchObject(body);
  });

  test('the next function should have been called', () => {
    const audit = AuditConfig.middleware(consoleOptions);
    audit(req, res, next);
    expect(next).toHaveBeenCalled();
  });
});

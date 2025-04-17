import { describe, it, expect } from "bun:test";
import { logger } from "./logger.js";
import assert from 'assert';
import sinon from 'sinon';

describe('logger', () => {
  it('formatMemory should format bytes correctly', () => {
    assert.equal(logger.formatMemory(512), '512 B');
    assert.equal(logger.formatMemory(2048), '2.00 KB');
    assert.equal(logger.formatMemory(1048576), '1.00 MB');
    assert.equal(logger.formatMemory(1073741824), '1.00 GB');
  });

  it('formatDuration should format seconds correctly', () => {
    assert.equal(logger.formatDuration(30), '30.00s');
    assert.equal(logger.formatDuration(90), '1m 30s');
    assert.equal(logger.formatDuration(3661), '1h 1m 1s');
  });

  it('should log messages', () => {
    const spy = sinon.spy(console, 'log');
    logger.info('test message');
    const calledWith = spy.args.some(args => args.join(' ').includes('test message'));
    spy.restore();
    assert(calledWith);
  });

  it('should log errors', () => {
    const spy = sinon.spy(console, 'error');
    logger.error('test error');
    const calledWith = spy.args.some(args => args.join(' ').includes('test error'));
    spy.restore();
    assert(calledWith);
  });

  it("should log info messages", () => {
    expect(() => logger.info("bun info test")).not.toThrow();
  });

  it("should log error messages", () => {
    expect(() => logger.error("bun error test")).not.toThrow();
  });
});
import assert from 'assert';
import fs from 'fs';
import { execSync } from 'child_process';
import path from 'path';

describe('emm CLI --out option', function() {
  const testScript = path.join(__dirname, 'mem-check.js');
  const outFile = path.join(__dirname, 'test-output.txt');

  before(function() {
    // Create a simple script to monitor
    fs.writeFileSync(testScript, 'setTimeout(() => {}, 1000);');
    if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
  });

  after(function() {
    fs.unlinkSync(testScript);
    if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
  });

  it('should write memory stats to the output file', function() {
    execSync(`node ../dist/index.js ${testScript} --interval 200 --out ${outFile}`);
    const content = fs.readFileSync(outFile, 'utf8');
    assert(content.includes('Memory usage'));
  });

  it('should echo memory stats to stdout if --out is not provided', function() {
    const output = execSync(`node ../dist/index.js ${testScript} --interval 200`).toString();
    assert(output.includes('Memory usage'));
  });
});
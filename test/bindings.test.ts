import { TypeGenerator } from '../lib';
import { srcmak } from 'jsii-srcmak';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

jest.setTimeout(5 * 60 * 1000);

test('language bindings', async () => {
  const g = new TypeGenerator();

  g.emitType('Name', {
    properties: {
      first: { type: 'string' },
      middle: { type: 'string' },
      last: { type: 'string' },
    },
    required: [ 'first', 'last' ],
  });

  const workdir = fs.mkdtempSync(path.join(os.tmpdir(), 'json2jsii'));
  await g.writeToFile(path.join(workdir, 'typescript', 'index.ts'));

  fs.mkdirSync(path.join(workdir, 'java'));

  await srcmak(path.join(workdir, 'typescript'), {
    java: {
      outdir: path.join(workdir, 'java'),
      package: 'org.myorg',
    },
    python: {
      outdir: path.join(workdir, 'python'),
      moduleName: 'myorg',
    },
  });

  expect(readFile(path.join(workdir, 'python/myorg/__init__.py'))).toMatchSnapshot();
  expect(readFile(path.join(workdir, 'java/src/main/java/org/myorg/Name.java'), [ '@javax.annotation.Generated' ])).toMatchSnapshot();
});

function readFile(filePath: string, ignoreLines: string[] = []) {
  const lines = (fs.readFileSync(filePath, 'utf-8')).split('\n');
  const shouldInclude = (line: string) => !ignoreLines.find(pattern => line.includes(pattern));
  return lines.filter(shouldInclude).join('\n');
}
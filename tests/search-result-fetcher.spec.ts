import test from 'ava';
import fsPromises from 'fs/promises';
import nock from 'nock';
import path from 'path';
import { fileURLToPath } from 'url';
import { getReferencesMatchingPhrase } from '../dist';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.before(async () => {
  nock.disableNetConnect();
  nock('https://www.bible.com')
    .persist()
    .get(/^\/search/)
    .reply(200, await fsPromises.readFile(path.join(__dirname, 'html', 'search.html')));
});

test.after(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

test('should correctly parse reference names from HTML', async (t) => {
  const references = await getReferencesMatchingPhrase('love others');
  t.regex(references[0].name, /Romans 13:8/);
  t.regex(references[1].name, /John 15:12/);
  t.regex(references[2].name, /1 Peter 4:8/);
  t.is(references.length, 3);
});

test('should correctly parse reference content from HTML', async (t) => {
  const references = await getReferencesMatchingPhrase('love others');
  t.regex(String(references[0].content), /Lorem/);
  t.regex(String(references[1].content), /consectetur/);
  t.regex(String(references[2].content), /Ut aliquam/);
  t.is(references.length, 3);
});

test('should correctly parse reference ID from HTML', async (t) => {
  const references = await getReferencesMatchingPhrase('love others');
  t.is(references[0].id, '111/ROM.13.8');
  t.is(references[1].id, '111/JHN.15.12');
  t.is(references[2].id, '111/1PE.4.8');
  t.is(references.length, 3);
});

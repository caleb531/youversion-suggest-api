import test from 'ava';
import fsPromises from 'fs/promises';
import nock from 'nock';
import path from 'path';
import { fileURLToPath } from 'url';
import { BibleReferenceEmptyContentError, BibleReferenceNotFoundError, fetchReferenceContent } from '../dist';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.before(async () => {
  nock.disableNetConnect();
  nock('https://www.bible.com')
    .persist()
    .get(/^\/bible/)
    .reply(200, await fsPromises.readFile(path.join(__dirname, 'html', 'psa.23.html')));
});

test.after(() => {
  nock.cleanAll();
  nock.enableNetConnect();
});

test('should copy reference content for chapter', async (t) => {
  const reference = await fetchReferenceContent('111/psa.23');
  t.regex(String(reference.content), /Lorem/);
  t.regex(String(reference.content), /nunc nulla/);
  t.regex(String(reference.content), /fermentum/);
});

test('should copy reference content for verse', async (t) => {
  const reference = await fetchReferenceContent('111/psa.23.2');
  t.notRegex(String(reference.content), /Lorem/);
  t.regex(String(reference.content), /nunc nulla/);
  t.notRegex(String(reference.content), /fermentum/);
});

test('should copy reference content for verse range', async (t) => {
  const reference = await fetchReferenceContent('111/psa.23.1-2');
  t.regex(String(reference.content), /Lorem/);
  t.regex(String(reference.content), /nunc nulla/);
  t.notRegex(String(reference.content), /fermentum/);
});

test('should be case-insensitive for reference IDs', async (t) => {
  const reference = await fetchReferenceContent('59/PsA.23');
  t.is(reference.name, 'Psalms 23');
});

test('should fetch reference content by query', async (t) => {
  const reference = await fetchReferenceContent('ps 23 esv');
  t.is(reference.name, 'Psalms 23');
  t.is(reference.version.name, 'ESV');
});

test('should throw error for empty content', async (t) => {
  await t.throwsAsync(
    async () => {
      await fetchReferenceContent('59/psa.23.11');
    },
    { instanceOf: BibleReferenceEmptyContentError }
  );
});

test('should throw error for query matching nonexistent reference', async (t) => {
  await t.throwsAsync(
    async () => {
      await fetchReferenceContent('xyz 23 esv');
    },
    { instanceOf: BibleReferenceNotFoundError }
  );
});

test('should throw error for nonexistent book ID', async (t) => {
  await t.throwsAsync(
    async () => {
      await fetchReferenceContent('111/xyz.23.6');
    },
    { instanceOf: BibleReferenceNotFoundError }
  );
});

test('should throw error for nonexistent version ID', async (t) => {
  await t.throwsAsync(
    async () => {
      await fetchReferenceContent('0/psa.23.6');
    },
    { instanceOf: BibleReferenceNotFoundError }
  );
});

test('should provide reference name in returned object', async (t) => {
  const reference = await fetchReferenceContent('59/psa.23');
  t.is(reference.name, 'Psalms 23');
});

test('reference name should reflect chosen language', async (t) => {
  const reference = await fetchReferenceContent('128/psa.23', {
    language: 'spa'
  });
  t.is(reference.name, 'Salmo 23');
});

test('should handle spaces appropriately', async (t) => {
  const reference = await fetchReferenceContent('111/psa.23');
  t.regex(String(reference.content), /adipiscing elit./, 'should respect content consisting of spaces');
  t.regex(String(reference.content), /consectetur adipiscing/, 'should collapse consecutive spaces');
});

test('should add line breaks where appropriate', async (t) => {
  const reference = await fetchReferenceContent('111/psa.23');
  t.regex(String(reference.content), /amet,\nconsectetur/, 'should add newline before each p block');
  t.regex(String(reference.content), /erat.\n\n\S/, 'should add newline after each p block');
  t.regex(String(reference.content), /orci,\ndapibus/, 'should add newline between each qc block');
  t.regex(String(reference.content), /nec\nfermentum/, 'should add newline between each q block');
  t.regex(String(reference.content), /elit.\n\nUt/, 'should add newlines around each li1 block');
  t.regex(String(reference.content), /leo,\n\nhendrerit/, 'should add two newlines for each b block');
});

test('should strip line breaks where appropriate', async (t) => {
  const reference = await fetchReferenceContent('111/psa.23', {
    includeVerseNumbers: false,
    includeLineBreaks: false
  });
  t.regex(String(reference.content), /amet, consectetur/, 'should not add newline before each p block');
  t.regex(String(reference.content), /erat. \S/, 'should not add newline after each p block');
  t.regex(String(reference.content), /orci, dapibus/, 'should not add newline between each qc block');
  t.regex(String(reference.content), /nec fermentum/, 'should not add newline between each q block');
  t.regex(String(reference.content), /elit. Ut/, 'should not add newlines around each li1 block');
  t.regex(String(reference.content), /leo, hendrerit/, 'should not add two newlines for each b block');
});

test('should display verse numbers correctly when stripping line breaks', async (t) => {
  const reference = await fetchReferenceContent('111/psa.23', {
    includeVerseNumbers: true,
    includeLineBreaks: false
  });
  t.regex(String(reference.content), /\b1 » “Lorem ipsum”/, 'should display number for verse 1');
  t.regex(String(reference.content), /elit. 2 Ut/, 'should display number for verse 2');
  t.regex(String(reference.content), /erat. 3 › Nunc/, 'should display number for verse 3');
  t.regex(String(reference.content), /leo, 4 hendrerit/, 'should display number for verse 4');
  t.regex(String(reference.content), /leo, 4 hendrerit/, 'should display number for verse 4');
  t.regex(String(reference.content), /nec 5 fermentum/, 'should display number for verse 5');
  t.regex(String(reference.content), /orci, 7-9 dapibus/, 'should display number for verses 7-9');
  t.regex(String(reference.content), /augue in, 10 dictum/, 'should display number for verse 10');
});

test('should display verse numbers correctly with line breaks', async (t) => {
  const reference = await fetchReferenceContent('111/psa.23', {
    includeVerseNumbers: true,
    includeLineBreaks: true
  });
  t.regex(String(reference.content), /5 fermentum/);
  t.notRegex(String(reference.content), /#/);
});

test('should handle verse range labels (used by versions like the MSG)', async (t) => {
  const reference = await fetchReferenceContent('111/psa.23.7-9', {
    includeVerseNumbers: true,
    includeLineBreaks: true
  });
  t.regex(String(reference.content), /7-9 dapibus et augue in,/);
  t.notRegex(String(reference.content), /#/);
});

test('should handle range labels when verse at start of range is given', async (t) => {
  const reference = await fetchReferenceContent('111/psa.23.7', {
    includeVerseNumbers: true,
    includeLineBreaks: true
  });
  t.regex(String(reference.content), /7-9 dapibus et augue in,/);
  t.notRegex(String(reference.content), /#/);
});

test('should handle range labels when verse at end of range is given', async (t) => {
  const reference = await fetchReferenceContent('111/psa.23.9', {
    includeVerseNumbers: true,
    includeLineBreaks: true
  });
  t.regex(String(reference.content), /7-9 dapibus et augue in,/);
  t.notRegex(String(reference.content), /#/);
});

test('should handle range labels when verse in middle of range is given', async (t) => {
  const reference = await fetchReferenceContent('111/psa.23.8', {
    includeVerseNumbers: true,
    includeLineBreaks: true
  });
  t.regex(String(reference.content), /7-9 dapibus et augue in,/);
  t.notRegex(String(reference.content), /#/);
});

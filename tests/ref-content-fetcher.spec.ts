import { assert, expect } from 'chai';
import fsPromises from 'fs/promises';
import nock from 'nock';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchReferenceContent } from '../dist';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('reference content fetcher', () => {
  before(async () => {
    nock.disableNetConnect();
    nock('https://www.bible.com')
      .persist()
      .get(/^\/bible/)
      .reply(200, await fsPromises.readFile(path.join(__dirname, 'html', 'psa.23.html')));
  });

  after(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  it('should copy reference content for chapter', async () => {
    const reference = await fetchReferenceContent('111/psa.23');
    expect(reference.content).to.match(/Lorem/);
    expect(reference.content).to.match(/nunc nulla/);
    expect(reference.content).to.match(/fermentum/);
  });

  it('should copy reference content for verse', async () => {
    const reference = await fetchReferenceContent('111/psa.23.2');
    expect(reference.content).not.to.match(/Lorem/);
    expect(reference.content).to.match(/nunc nulla/);
    expect(reference.content).not.to.match(/fermentum/);
  });

  it('should copy reference content for verse range', async () => {
    const reference = await fetchReferenceContent('111/psa.23.1-2');
    expect(reference.content).to.match(/Lorem/);
    expect(reference.content).to.match(/nunc nulla/);
    expect(reference.content).not.to.match(/fermentum/);
  });

  it('should be case-insensitive for reference IDs', async () => {
    const reference = await fetchReferenceContent('59/PsA.23');
    expect(reference.name).to.equal('Psalms 23');
  });

  it('should fetch reference content by query', async () => {
    const reference = await fetchReferenceContent('ps 23 esv');
    expect(reference.name).to.equal('Psalms 23');
    expect(reference.version.name).to.equal('ESV');
  });

  it('should throw error for empty content', async () => {
    try {
      await fetchReferenceContent('59/psa.23.11');
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
      return;
    }
    assert.fail('Error is never thrown for empty content');
  });

  it('should throw error for nonexistent reference', async () => {
    try {
      await fetchReferenceContent('xyz 23 esv');
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
      return;
    }
    assert.fail('Error is never thrown for nonexistent reference');
  });

  it('should provide reference name in returned object', async () => {
    const reference = await fetchReferenceContent('59/psa.23');
    expect(reference.name).to.equal('Psalms 23');
  });

  it('reference name should reflect chosen language', async () => {
    const reference = await fetchReferenceContent('128/psa.23', {
      language: 'spa'
    });
    expect(reference.name).to.equal('Salmo 23');
  });

  it('should handle spaces appropriately', async () => {
    const reference = await fetchReferenceContent('111/psa.23');
    expect(reference.content).to.match(/adipiscing elit./, 'should respect content consisting of spaces');
    expect(reference.content).to.match(/consectetur adipiscing/, 'should collapse consecutive spaces');
  });

  it('should add line breaks where appropriate', async () => {
    const reference = await fetchReferenceContent('111/psa.23');
    expect(reference.content).to.match(/amet,\nconsectetur/, 'should add newline before each p block');
    expect(reference.content).to.match(/erat.\n\n\S/, 'should add newline after each p block');
    expect(reference.content).to.match(/orci,\ndapibus/, 'should add newline between each qc block');
    expect(reference.content).to.match(/nec\nfermentum/, 'should add newline between each q block');
    expect(reference.content).to.match(/elit.\n\nUt/, 'should add newlines around each li1 block');
    expect(reference.content).to.match(/leo,\n\nhendrerit/, 'should add two newlines for each b block');
  });

  it('should strip line breaks where appropriate', async () => {
    const reference = await fetchReferenceContent('111/psa.23', {
      includeVerseNumbers: false,
      includeLineBreaks: false
    });
    expect(reference.content).to.match(/amet, consectetur/, 'should not add newline before each p block');
    expect(reference.content).to.match(/erat. \S/, 'should not add newline after each p block');
    expect(reference.content).to.match(/orci, dapibus/, 'should not add newline between each qc block');
    expect(reference.content).to.match(/nec fermentum/, 'should not add newline between each q block');
    expect(reference.content).to.match(/elit. Ut/, 'should not add newlines around each li1 block');
    expect(reference.content).to.match(/leo, hendrerit/, 'should not add two newlines for each b block');
  });

  it('should display verse numbers correctly when stripping line breaks', async () => {
    const reference = await fetchReferenceContent('111/psa.23', {
      includeVerseNumbers: true,
      includeLineBreaks: false
    });
    expect(reference.content).to.match(/\b1 » “Lorem ipsum”/, 'should display number for verse 1');
    expect(reference.content).to.match(/elit. 2 Ut/, 'should display number for verse 2');
    expect(reference.content).to.match(/erat. 3 › Nunc/, 'should display number for verse 3');
    expect(reference.content).to.match(/leo, 4 hendrerit/, 'should display number for verse 4');
    expect(reference.content).to.match(/leo, 4 hendrerit/, 'should display number for verse 4');
    expect(reference.content).to.match(/nec 5 fermentum/, 'should display number for verse 5');
    expect(reference.content).to.match(/orci, 7-9 dapibus/, 'should display number for verses 7-9');
    expect(reference.content).to.match(/augue in, 10 dictum/, 'should display number for verse 10');
  });

  it('should display verse numbers correctly with line breaks', async () => {
    const reference = await fetchReferenceContent('111/psa.23', {
      includeVerseNumbers: true,
      includeLineBreaks: true
    });
    expect(reference.content).to.match(/5 fermentum/);
    expect(reference.content).not.to.match(/#/);
  });

  it('should handle verse range labels (used by versions like the MSG)', async () => {
    const reference = await fetchReferenceContent('111/psa.23.7-9', {
      includeVerseNumbers: true,
      includeLineBreaks: true
    });
    expect(reference.content).to.match(/7-9 dapibus et augue in,/);
    expect(reference.content).not.to.match(/#/);
  });

  it('should handle range labels when verse at start of range is given', async () => {
    const reference = await fetchReferenceContent('111/psa.23.7', {
      includeVerseNumbers: true,
      includeLineBreaks: true
    });
    expect(reference.content).to.match(/7-9 dapibus et augue in,/);
    expect(reference.content).not.to.match(/#/);
  });

  it('should handle range labels when verse at end of range is given', async () => {
    const reference = await fetchReferenceContent('111/psa.23.9', {
      includeVerseNumbers: true,
      includeLineBreaks: true
    });
    expect(reference.content).to.match(/7-9 dapibus et augue in,/);
    expect(reference.content).not.to.match(/#/);
  });

  it('should handle range labels when verse in middle of range is given', async () => {
    const reference = await fetchReferenceContent('111/psa.23.8', {
      includeVerseNumbers: true,
      includeLineBreaks: true
    });
    expect(reference.content).to.match(/7-9 dapibus et augue in,/);
    expect(reference.content).not.to.match(/#/);
  });
});

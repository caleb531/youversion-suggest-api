import { expect } from 'chai';
import fsPromises from 'fs/promises';
import nock from 'nock';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchReferenceContent } from '../src';

// __dirname is not available in ES modules natively, so we must define it
const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('fetchReferenceContent', () => {
  before(async () => {
    nock('https://www.bible.com')
      .persist()
      .get(/bible/)
      .reply(200, await fsPromises.readFile(path.join(__dirname, 'html', 'psa.23.html')));
  });

  after(() => {
    nock.cleanAll();
    nock.disableNetConnect();
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
});

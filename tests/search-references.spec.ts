import { expect } from 'chai';
import fsPromises from 'fs/promises';
import nock from 'nock';
import path from 'path';
import { fileURLToPath } from 'url';
import { getReferencesMatchingPhrase } from '../src';

// __dirname is not available in ES modules natively, so we must define it
const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('getReferencesMatchingPhrase', () => {
  before(async () => {
    nock('https://www.bible.com')
      .persist()
      .get(/bible/)
      .reply(200, await fsPromises.readFile(path.join(__dirname, 'html', 'search.html')));
  });

  after(() => {
    nock.cleanAll();
    nock.disableNetConnect();
  });

  it('should correctly parse result titles from HTML', async () => {
    const references = await getReferencesMatchingPhrase('love others');
    expect(references[0].name).to.match(/Romans 13:8/);
    expect(references[1].name).to.match(/John 15:12/);
    expect(references[2].name).to.match(/1 Peter 4:8/);
    expect(references).to.have.length(3);
  });

  it('should correctly parse result subtitles from HTML', async () => {
    const references = await getReferencesMatchingPhrase('love others');
    expect(references[0].content).to.match(/Lorem/);
    expect(references[1].content).to.match(/consectetur/);
    expect(references[2].content).to.match(/Ut aliquam/);
    expect(references).to.have.length(3);
  });

  it('should correctly parse result UID arguments from HTML', async () => {
    const references = await getReferencesMatchingPhrase('love others');
    expect(references[0]).to.have.property('id', '111/ROM.13.8');
    expect(references[1]).to.have.property('id', '111/JHN.15.12');
    expect(references[2]).to.have.property('id', '111/1PE.4.8');
    expect(references).to.have.length(3);
  });
});

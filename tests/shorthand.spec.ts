import { expect } from 'chai';
import { getReferencesMatchingName } from '../src';

describe('getReferencesMatchingName shorthand syntax logic', () => {
  it('should recognize shorthand book syntax', async () => {
    const references = await getReferencesMatchingName('1co');
    expect(references[0].name).to.equal('1 Corinthians 1');
    expect(references).to.have.length(1);
  });

  it('should recognize shorthand chapter syntax', async () => {
    const references = await getReferencesMatchingName('1 co13');
    expect(references[0].name).to.equal('1 Corinthians 13');
    expect(references).to.have.length(1);
  });

  it('should recognize shorthand version syntax', async () => {
    const references = await getReferencesMatchingName('1 co 13esv');
    expect(references[0].name).to.equal('1 Corinthians 13');
    expect(references[0].version.name).to.equal('ESV');
    expect(references).to.have.length(1);
  });

  it('should allow shorthand Unicode versions', async () => {
    const references = await getReferencesMatchingName('創世記1:3次經', {
      language: 'zho_tw',
      fallbackVersion: 46
    });
    expect(references[0].name).to.equal('創世記 1:3');
    expect(references).to.have.length(1);
  });
});

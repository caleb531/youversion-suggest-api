import { expect } from 'chai';
import { getReferencesMatchingName } from '../src';

describe('getReferencesMatchingName edge cases', () => {
  it('should not match empty input', async () => {
    const references = await getReferencesMatchingName('');
    expect(references).to.have.length(0);
  });

  it('should not match entirely non-alphanumeric input', async () => {
    const references = await getReferencesMatchingName('!!!');
    expect(references).to.have.length(0);
  });

  it('should ignore excessive whitespace', async () => {
    const references = await getReferencesMatchingName('  romans  8  28  nl  ');
    expect(references[0]).to.have.property('name', 'Romans 8:28');
    expect(references).to.have.length(1);
  });

  it('should ignore non-alphanumeric characters', async () => {
    const references = await getReferencesMatchingName('!1@co#13$4^7&es*');
    expect(references[0]).to.have.property('name', '1 Corinthians 13:4-7');
    expect(references).to.have.length(1);
  });

  it('should ignore trailing non-matching alphanumeric characters', async () => {
    const references = await getReferencesMatchingName('2 co 3 x y z 1 2 3');
    expect(references[0]).to.have.property('name', '2 Corinthians 3');
    expect(references).to.have.length(1);
  });

  it('should recognize accented Unicode characters', async () => {
    const references = await getReferencesMatchingName('é 3', {
      language: 'spa',
      fallbackVersion: 128
    });
    expect(references[0]).to.have.property('name', 'Éxodo 3');
    expect(references).to.have.length(1);
  });

  it('should normalize Unicode characters', async () => {
    const references = await getReferencesMatchingName('e\u0301');
    expect(references).to.have.length(0);
  });

  it('should match numbered books even if book name contains punctuation ', async () => {
    const references = await getReferencesMatchingName('1 ch', {
      language: 'deu',
      fallbackVersion: 51
    });
    expect(references[0]).to.have.property('name', '1. Chronik 1');
    expect(references).to.have.length(1);
  });
});

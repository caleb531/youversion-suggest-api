import { expect } from 'chai';
import { getReferencesMatchingName } from '../src';

describe('getReferencesMatchingName book logic', () => {
  it('should match books by partial name', async () => {
    const references = await getReferencesMatchingName('luk');
    expect(references[0].name).to.equal('Luke 1');
    expect(references).to.have.length(1);
  });

  it('should match books irrespective of case', async () => {
    const queryStr = 'Matthew';
    const references = await getReferencesMatchingName(queryStr);
    const referencesLower = await getReferencesMatchingName(queryStr.toLowerCase());
    const referencesUpper = await getReferencesMatchingName(queryStr.toUpperCase());
    expect(referencesLower).to.deep.equal(references);
    expect(referencesUpper).to.deep.equal(references);
    expect(references).to.have.length(1);
  });

  it('should match books by ambiguous partial name', async () => {
    const references = await getReferencesMatchingName('r');
    expect(references[0].name).to.equal('Ruth 1');
    expect(references[1].name).to.equal('Romans 1');
    expect(references[2].name).to.equal('Revelation 1');
    expect(references).to.have.length(3);
  });

  it('should match numbered books by partial numbered name', async () => {
    const references = await getReferencesMatchingName('1 cor');
    expect(references[0].name).to.equal('1 Corinthians 1');
    expect(references).to.have.length(1);
  });

  it('should match single number query', async () => {
    const references = await getReferencesMatchingName('2');
    expect(references).to.have.length(8);
  });

  it('should match numbered and non-numbered books by partial name', async () => {
    const references = await getReferencesMatchingName('c');
    expect(references[0].name).to.equal('Colossians 1');
    expect(references[1].name).to.equal('1 Chronicles 1');
    expect(references[2].name).to.equal('2 Chronicles 1');
    expect(references[3].name).to.equal('1 Corinthians 1');
    expect(references[4].name).to.equal('2 Corinthians 1');
    expect(references).to.have.length(5);
  });

  it('should match word other than first word in book name', async () => {
    const references = await getReferencesMatchingName('la', {
      language: 'fin',
      fallbackVersion: 330
    });
    expect(references[0].name).to.equal('Laulujen laulu 1');
    expect(references).to.have.length(1);
  });

  it('should use correct ID for books', async () => {
    const references = await getReferencesMatchingName('philippians');
    expect(references[0].id).to.equal('111/PHP.1');
    expect(references).to.have.length(1);
  });

  it('should not match nonexistent books', async () => {
    const references = await getReferencesMatchingName('xyz');
    expect(references).to.have.length(0);
  });
});

import { expect } from 'chai';
import { getReferencesMatchingName } from '../src';

describe('getReferencesMatchingName', () => {
  it('should match verses', async () => {
    const references = await getReferencesMatchingName('luke 4:8');
    expect(references[0].name).to.equal('Luke 4:8');
    expect(references).to.have.length(1);
  });

  it('should match verses by ambiguous book reference', async () => {
    const references = await getReferencesMatchingName('a 3:2');
    expect(references[0].name).to.equal('Amos 3:2');
    expect(references[1].name).to.equal('Acts 3:2');
    expect(references).to.have.length(2);
  });

  it('should match verses preceded by dot', async () => {
    const references = await getReferencesMatchingName('luke 4.8');
    expect(references[0].name).to.equal('Luke 4:8');
    expect(references).to.have.length(1);
  });

  it('should match verses preceded by space', async () => {
    const references = await getReferencesMatchingName('luke 4 8');
    expect(references[0].name).to.equal('Luke 4:8');
    expect(references).to.have.length(1);
  });

  it('should use correct ID for verses', async () => {
    const references = await getReferencesMatchingName('luke 4:8');
    expect(references[0].id).to.equal('111/LUK.4.8');
    expect(references).to.have.length(1);
  });

  it('should match verse ranges', async () => {
    const references = await getReferencesMatchingName('1 cor 13.4-7');
    expect(references[0].name).to.equal('1 Corinthians 13:4-7');
    expect(references).to.have.length(1);
  });

  it('should use correct ID for verse ranges', async () => {
    const references = await getReferencesMatchingName('1 cor 13.4-7');
    expect(references[0].id).to.equal('111/1CO.13.4-7');
    expect(references).to.have.length(1);
  });

  it('should not match nonexistent ranges', async () => {
    const references = await getReferencesMatchingName('1 cor 13.4-3');
    expect(references[0].name).to.equal('1 Corinthians 13:4');
    expect(references).to.have.length(1);
  });

  it('should interpret verse zero as verse one', async () => {
    const references = await getReferencesMatchingName('ps 23:0');
    expect(references[0].name).to.equal('Psalms 23:1');
    expect(references).to.have.length(1);
  });
});

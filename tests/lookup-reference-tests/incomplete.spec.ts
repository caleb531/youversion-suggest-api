import { expect } from 'chai';
import { getReferencesMatchingName } from '../../src';

describe('reference lookup handling of incomplete queries', () => {
  it('should treat incomplete verse reference as chapter reference', async () => {
    const references = await getReferencesMatchingName('Psalms 19:');
    expect(references[0]).to.have.property('name', 'Psalms 19');
    expect(references).to.have.length(1);
  });

  it('should treat incomplete .verse reference as chapter reference', async () => {
    const references = await getReferencesMatchingName('Psalms 19.');
    expect(references[0]).to.have.property('name', 'Psalms 19');
    expect(references).to.have.length(1);
  });

  it('should treat incomplete verse ranges as single-verse references', async () => {
    const references = await getReferencesMatchingName('Psalms 19.7-');
    expect(references[0]).to.have.property('name', 'Psalms 19:7');
    expect(references).to.have.length(1);
  });
});

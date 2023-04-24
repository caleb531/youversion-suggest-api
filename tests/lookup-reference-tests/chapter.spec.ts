import { expect } from 'chai';
import { getReferencesMatchingName } from '../../src';

describe('getReferencesMatchingName chapter logic', () => {
  it('should match chapters', async () => {
    const references = await getReferencesMatchingName('matthew 5');
    expect(references[0]).to.have.property('name', 'Matthew 5');
    expect(references).to.have.length(1);
  });

  it('should match chapters by ambiguous book name', async () => {
    const references = await getReferencesMatchingName('a 3');
    expect(references[0]).to.have.property('name', 'Amos 3');
    expect(references[1]).to.have.property('name', 'Acts 3');
    expect(references).to.have.length(2);
  });

  it('should use correct ID for chapters', async () => {
    const references = await getReferencesMatchingName('luke 4');
    expect(references[0]).to.have.property('id', '111/LUK.4');
    expect(references).to.have.length(1);
  });

  it('should interpret chapter zero as chapter one', async () => {
    const references = await getReferencesMatchingName('ps 0');
    expect(references[0]).to.have.property('name', 'Psalms 1');
    expect(references).to.have.length(1);
  });
});

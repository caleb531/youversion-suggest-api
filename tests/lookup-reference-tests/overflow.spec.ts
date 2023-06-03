import { expect } from 'chai';
import { getReferencesMatchingName } from '../../dist';

describe('reference lookup overflow cases', () => {
  it('should constrain specified chapter to last chapter if too high', async () => {
    const references = await getReferencesMatchingName('a 25:2');
    expect(references[0]).to.have.property('name', 'Amos 9:2');
    expect(references[1]).to.have.property('name', 'Acts 25:2');
    expect(references).to.have.length(2);
  });

  it('should constrain specified verse to last verse if too high', async () => {
    const references = await getReferencesMatchingName('a 2:50');
    expect(references[0]).to.have.property('name', 'Amos 2:16');
    expect(references[1]).to.have.property('name', 'Acts 2:47');
    expect(references).to.have.length(2);
  });

  it('should constrain specified end verse to last endverse if too high', async () => {
    const references = await getReferencesMatchingName('a 2:4-51');
    expect(references[0]).to.have.property('name', 'Amos 2:4-16');
    expect(references[1]).to.have.property('name', 'Acts 2:4-47');
    expect(references).to.have.length(2);
  });

  it('should revert to single verse if verse and end verse are too high', async () => {
    const references = await getReferencesMatchingName('ps 23.7-9');
    expect(references[0]).to.have.property('name', 'Psalms 23:6');
    expect(references).to.have.length(1);
  });
});

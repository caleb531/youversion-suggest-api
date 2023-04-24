import { expect } from 'chai';
import { getFirstReferenceMatchingName } from '../../src';

describe('getFirstReferenceMatchingName book logic', () => {
  it('should match reference without options', async () => {
    const reference = await getFirstReferenceMatchingName('mat 11.28-30');
    expect(reference).to.have.property('name', 'Matthew 11:28-30');
    expect(reference.version).to.have.property('name', 'NIV');
  });

  it('should match reference with options', async () => {
    const reference = await getFirstReferenceMatchingName('éx 3.14', {
      language: 'spa',
      fallbackVersion: 'rvc'
    });
    expect(reference).to.have.property('name', 'Éxodo 3:14');
    expect(reference.version).to.have.property('name', 'RVC');
  });
});

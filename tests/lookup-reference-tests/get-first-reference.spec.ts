import { describe, expect, it } from 'vitest';
import { getFirstReferenceMatchingName } from '../../src';

describe('retrieval of the first matching reference', () => {
  it('should match reference without options', async () => {
    const reference = await getFirstReferenceMatchingName('mat 11.28-30');
    expect(reference.name).toEqual('Matthew 11:28-30');
    expect(reference.version.name).toEqual('NIV');
  });

  it('should match reference with options', async () => {
    const reference = await getFirstReferenceMatchingName('éx 3.14', {
      language: 'spa',
      fallbackVersion: 'rvc'
    });
    expect(reference.name).toEqual('Éxodo 3:14');
    expect(reference.version.name).toEqual('RVC');
  });
});

import { describe, expect, it } from 'vitest';
import { getReferencesMatchingName } from '../../src';

describe('handling incomplete queries', () => {
  it('should treat incomplete verse reference as chapter reference', async () => {
    const references = await getReferencesMatchingName('Psalms 19:');
    expect(references[0].name).toEqual('Psalms 19');
    expect(references.length).toEqual(1);
  });

  it('should treat incomplete .verse reference as chapter reference', async () => {
    const references = await getReferencesMatchingName('Psalms 19.');
    expect(references[0].name).toEqual('Psalms 19');
    expect(references.length).toEqual(1);
  });

  it('should treat incomplete verse ranges as single-verse references', async () => {
    const references = await getReferencesMatchingName('Psalms 19.7-');
    expect(references[0].name).toEqual('Psalms 19:7');
    expect(references.length).toEqual(1);
  });
});

import { describe, expect, it } from 'vitest';
import { getReferencesMatchingName } from '../../src';

describe('handling range overflow', () => {
  it('should constrain specified chapter to last chapter if too high', async () => {
    const references = await getReferencesMatchingName('a 25:2');
    expect(references[0].name).toEqual('Amos 9:2');
    expect(references[1].name).toEqual('Acts 25:2');
    expect(references.length).toEqual(2);
  });

  it('should constrain specified verse to last verse if too high', async () => {
    const references = await getReferencesMatchingName('a 2:50');
    expect(references[0].name).toEqual('Amos 2:16');
    expect(references[1].name).toEqual('Acts 2:47');
    expect(references.length).toEqual(2);
  });

  it('should constrain specified end verse to last endverse if too high', async () => {
    const references = await getReferencesMatchingName('a 2:4-51');
    expect(references[0].name).toEqual('Amos 2:4-16');
    expect(references[1].name).toEqual('Acts 2:4-47');
    expect(references.length).toEqual(2);
  });

  it('should revert to single verse if verse and end verse are too high', async () => {
    const references = await getReferencesMatchingName('ps 23.7-9');
    expect(references[0].name).toEqual('Psalms 23:6');
    expect(references.length).toEqual(1);
  });
});

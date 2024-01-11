import { glob } from 'glob';
import { describe, expect, it } from 'vitest';
import { getLanguages } from '../src';

describe('utilities', () => {
  it('should retrieve list of all languages', async () => {
    const languages = await getLanguages();
    expect(
      languages.find((language) => {
        return language.id === 'eng';
      })?.name
    ).toEqual('English');
    expect(languages.length).toEqual((await glob('src/data/bible/bible-*.json')).length);
  });
});

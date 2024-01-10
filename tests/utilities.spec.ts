import { glob } from 'glob';
import { expect, test } from 'vitest';
import { getLanguages } from '../dist';

test('should retrieve list of all languages', async () => {
  const languages = await getLanguages();
  expect(
    languages.find((language) => {
      return language.id === 'eng';
    })?.name
  ).toEqual('English');
  expect(languages.length).toEqual((await glob('src/data/bible/bible-*.json')).length);
});

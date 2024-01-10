import test from 'ava';
import { glob } from 'glob';
import { getLanguages } from '../dist';

test('should retrieve list of all languages', async (t) => {
  const languages = await getLanguages();
  t.is(
    languages.find((language) => {
      return language.id === 'eng';
    })?.name,
    'English'
  );
  t.is(languages.length, (await glob('src/data/bible/bible-*.json')).length);
});

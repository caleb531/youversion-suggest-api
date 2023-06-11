import test from 'ava';
import { getReferencesMatchingName } from '../../dist';

test('should constrain specified chapter to last chapter if too high', async (t) => {
  const references = await getReferencesMatchingName('a 25:2');
  t.is(references[0].name, 'Amos 9:2');
  t.is(references[1].name, 'Acts 25:2');
  t.is(references.length, 2);
});

test('should constrain specified verse to last verse if too high', async (t) => {
  const references = await getReferencesMatchingName('a 2:50');
  t.is(references[0].name, 'Amos 2:16');
  t.is(references[1].name, 'Acts 2:47');
  t.is(references.length, 2);
});

test('should constrain specified end verse to last endverse if too high', async (t) => {
  const references = await getReferencesMatchingName('a 2:4-51');
  t.is(references[0].name, 'Amos 2:4-16');
  t.is(references[1].name, 'Acts 2:4-47');
  t.is(references.length, 2);
});

test('should revert to single verse if verse and end verse are too high', async (t) => {
  const references = await getReferencesMatchingName('ps 23.7-9');
  t.is(references[0].name, 'Psalms 23:6');
  t.is(references.length, 1);
});

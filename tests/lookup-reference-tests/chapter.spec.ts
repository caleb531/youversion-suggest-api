import test from 'ava';
import { getReferencesMatchingName } from '../../dist';

test('should match chapters', async (t) => {
  const references = await getReferencesMatchingName('matthew 5');
  t.is(references[0].name, 'Matthew 5');
  t.is(references.length, 1);
});

test('should match chapters by ambiguous book name', async (t) => {
  const references = await getReferencesMatchingName('a 3');
  t.is(references[0].name, 'Amos 3');
  t.is(references[1].name, 'Acts 3');
  t.is(references.length, 2);
});

test('should use correct ID for chapters', async (t) => {
  const references = await getReferencesMatchingName('luke 4');
  t.is(references[0].id, '111/LUK.4');
  t.is(references.length, 1);
});

test('should interpret chapter zero as chapter one', async (t) => {
  const references = await getReferencesMatchingName('ps 0');
  t.is(references[0].name, 'Psalms 1');
  t.is(references.length, 1);
});

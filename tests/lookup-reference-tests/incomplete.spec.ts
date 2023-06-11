import test from 'ava';
import { getReferencesMatchingName } from '../../dist';

test('should treat incomplete verse reference as chapter reference', async (t) => {
  const references = await getReferencesMatchingName('Psalms 19:');
  t.is(references[0].name, 'Psalms 19');
  t.is(references.length, 1);
});

test('should treat incomplete .verse reference as chapter reference', async (t) => {
  const references = await getReferencesMatchingName('Psalms 19.');
  t.is(references[0].name, 'Psalms 19');
  t.is(references.length, 1);
});

test('should treat incomplete verse ranges as single-verse references', async (t) => {
  const references = await getReferencesMatchingName('Psalms 19.7-');
  t.is(references[0].name, 'Psalms 19:7');
  t.is(references.length, 1);
});

import test from 'ava';
import { getReferencesMatchingName } from '../../dist';

test('should match verses', async (t) => {
  const references = await getReferencesMatchingName('luke 4:8');
  t.is(references[0].name, 'Luke 4:8');
  t.is(references.length, 1);
});

test('should match verses by ambiguous book reference', async (t) => {
  const references = await getReferencesMatchingName('a 3:2');
  t.is(references[0].name, 'Amos 3:2');
  t.is(references[1].name, 'Acts 3:2');
  t.is(references.length, 2);
});

test('should match verses preceded by dot', async (t) => {
  const references = await getReferencesMatchingName('luke 4.8');
  t.is(references[0].name, 'Luke 4:8');
  t.is(references.length, 1);
});

test('should match verses preceded by space', async (t) => {
  const references = await getReferencesMatchingName('luke 4 8');
  t.is(references[0].name, 'Luke 4:8');
  t.is(references.length, 1);
});

test('should use correct ID for verses', async (t) => {
  const references = await getReferencesMatchingName('luke 4:8');
  t.is(references[0].id, '111/LUK.4.8');
  t.is(references.length, 1);
});

test('should match verse ranges', async (t) => {
  const references = await getReferencesMatchingName('1 cor 13.4-7');
  t.is(references[0].name, '1 Corinthians 13:4-7');
  t.is(references.length, 1);
});

test('should use correct ID for verse ranges', async (t) => {
  const references = await getReferencesMatchingName('1 cor 13.4-7');
  t.is(references[0].id, '111/1CO.13.4-7');
  t.is(references.length, 1);
});

test('should not match nonexistent ranges', async (t) => {
  const references = await getReferencesMatchingName('1 cor 13.4-3');
  t.is(references[0].name, '1 Corinthians 13:4');
  t.is(references.length, 1);
});

test('should interpret verse zero as verse one', async (t) => {
  const references = await getReferencesMatchingName('ps 23:0');
  t.is(references[0].name, 'Psalms 23:1');
  t.is(references.length, 1);
});

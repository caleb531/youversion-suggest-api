import test from 'ava';
import { getReferencesMatchingName } from '../../dist';

test('should match books by partial name', async (t) => {
  const references = await getReferencesMatchingName('luk');
  t.is(references[0].name, 'Luke 1');
  t.is(references.length, 1);
});

test('should match books irrespective of case', async (t) => {
  const queryStr = 'Matthew';
  const references = await getReferencesMatchingName(queryStr);
  const referencesLower = await getReferencesMatchingName(queryStr.toLowerCase());
  const referencesUpper = await getReferencesMatchingName(queryStr.toUpperCase());
  t.deepEqual(referencesLower, references);
  t.deepEqual(referencesUpper, references);
  t.is(references.length, 1);
});

test('should match books by ambiguous partial name', async (t) => {
  const references = await getReferencesMatchingName('r');
  t.is(references[0].name, 'Ruth 1');
  t.is(references[1].name, 'Romans 1');
  t.is(references[2].name, 'Revelation 1');
  t.is(references.length, 3);
});

test('should match numbered books by partial numbered name', async (t) => {
  const references = await getReferencesMatchingName('1 cor');
  t.is(references[0].name, '1 Corinthians 1');
  t.is(references.length, 1);
});

test('should match single number query', async (t) => {
  const references = await getReferencesMatchingName('2');
  t.is(references.length, 8);
});

test('should match numbered and non-numbered books by partial name', async (t) => {
  const references = await getReferencesMatchingName('c');
  t.is(references[0].name, 'Colossians 1');
  t.is(references[1].name, '1 Chronicles 1');
  t.is(references[2].name, '2 Chronicles 1');
  t.is(references[3].name, '1 Corinthians 1');
  t.is(references[4].name, '2 Corinthians 1');
  t.is(references.length, 5);
});

test('should match word other than first word in book name', async (t) => {
  const references = await getReferencesMatchingName('la', {
    language: 'fin',
    fallbackVersion: 330
  });
  t.is(references[0].name, 'Laulujen laulu 1');
  t.is(references.length, 1);
});

test('should use correct ID for books', async (t) => {
  const references = await getReferencesMatchingName('philippians');
  t.is(references[0].id, '111/PHP.1');
  t.is(references.length, 1);
});

test('should not match nonexistent books', async (t) => {
  const references = await getReferencesMatchingName('xyz');
  t.is(references.length, 0);
});

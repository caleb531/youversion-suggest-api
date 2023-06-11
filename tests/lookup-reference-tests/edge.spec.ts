import test from 'ava';
import { getReferencesMatchingName } from '../../dist';

test('should not match empty input', async (t) => {
  const references = await getReferencesMatchingName('');
  t.is(references.length, 0);
});

test('should not match entirely non-alphanumeric input', async (t) => {
  const references = await getReferencesMatchingName('!!!');
  t.is(references.length, 0);
});

test('should ignore excessive whitespace', async (t) => {
  const references = await getReferencesMatchingName('  romans  8  28  nl  ');
  t.is(references[0].name, 'Romans 8:28');
  t.is(references.length, 1);
});

test('should ignore non-alphanumeric characters', async (t) => {
  const references = await getReferencesMatchingName('!1@co#13$4^7&es*');
  t.is(references[0].name, '1 Corinthians 13:4-7');
  t.is(references.length, 1);
});

test('should ignore trailing non-matching alphanumeric characters', async (t) => {
  const references = await getReferencesMatchingName('2 co 3 x y z 1 2 3');
  t.is(references[0].name, '2 Corinthians 3');
  t.is(references.length, 1);
});

test('should recognize accented Unicode characters', async (t) => {
  const references = await getReferencesMatchingName('é 3', {
    language: 'spa',
    fallbackVersion: 128
  });
  t.is(references[0].name, 'Éxodo 3');
  t.is(references.length, 1);
});

test('should normalize Unicode characters', async (t) => {
  const references = await getReferencesMatchingName('e\u0301');
  t.is(references.length, 0);
});

test('should match numbered books even if book name contains punctuation ', async (t) => {
  const references = await getReferencesMatchingName('1 ch', {
    language: 'deu',
    fallbackVersion: 51
  });
  t.is(references[0].name, '1. Chronik 1');
  t.is(references.length, 1);
});

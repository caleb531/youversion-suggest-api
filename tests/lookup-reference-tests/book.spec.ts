import { expect, test } from 'vitest';
import { getReferencesMatchingName } from '../../dist';

test('should match books by partial name', async () => {
  const references = await getReferencesMatchingName('luk');
  expect(references[0].name).toEqual('Luke 1');
  expect(references.length).toEqual(1);
});

test('should match books irrespective of case', async () => {
  const queryStr = 'Matthew';
  const references = await getReferencesMatchingName(queryStr);
  const referencesLower = await getReferencesMatchingName(queryStr.toLowerCase());
  const referencesUpper = await getReferencesMatchingName(queryStr.toUpperCase());
  expect(referencesLower).toEqual(references);
  expect(referencesUpper).toEqual(references);
  expect(references.length).toEqual(1);
});

test('should match books by ambiguous partial name', async () => {
  const references = await getReferencesMatchingName('r');
  expect(references[0].name).toEqual('Ruth 1');
  expect(references[1].name).toEqual('Romans 1');
  expect(references[2].name).toEqual('Revelation 1');
  expect(references.length).toEqual(3);
});

test('should match numbered books by partial numbered name', async () => {
  const references = await getReferencesMatchingName('1 cor');
  expect(references[0].name).toEqual('1 Corinthians 1');
  expect(references.length).toEqual(1);
});

test('should match single number query', async () => {
  const references = await getReferencesMatchingName('2');
  expect(references.length).toEqual(8);
});

test('should match numbered and non-numbered books by partial name', async () => {
  const references = await getReferencesMatchingName('c');
  expect(references[0].name).toEqual('Colossians 1');
  expect(references[1].name).toEqual('1 Chronicles 1');
  expect(references[2].name).toEqual('2 Chronicles 1');
  expect(references[3].name).toEqual('1 Corinthians 1');
  expect(references[4].name).toEqual('2 Corinthians 1');
  expect(references.length).toEqual(5);
});

test('should match word other than first word in book name', async () => {
  const references = await getReferencesMatchingName('la', {
    language: 'fin',
    fallbackVersion: 330
  });
  expect(references[0].name).toEqual('Laulujen laulu 1');
  expect(references.length).toEqual(1);
});

test('should use correct ID for books', async () => {
  const references = await getReferencesMatchingName('philippians');
  expect(references[0].id).toEqual('111/PHP.1');
  expect(references.length).toEqual(1);
});

test('should not match nonexistent books', async () => {
  const references = await getReferencesMatchingName('xyz');
  expect(references.length).toEqual(0);
});

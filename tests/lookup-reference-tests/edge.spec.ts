import { expect, test } from 'vitest';
import { getReferencesMatchingName } from '../../src';

test('should not match empty input', async () => {
  const references = await getReferencesMatchingName('');
  expect(references.length).toEqual(0);
});

test('should not match entirely non-alphanumeric input', async () => {
  const references = await getReferencesMatchingName('!!!');
  expect(references.length).toEqual(0);
});

test('should ignore excessive whitespace', async () => {
  const references = await getReferencesMatchingName('  romans  8  28  nl  ');
  expect(references[0].name).toEqual('Romans 8:28');
  expect(references.length).toEqual(1);
});

test('should ignore non-alphanumeric characters', async () => {
  const references = await getReferencesMatchingName('!1@co#13$4^7&es*');
  expect(references[0].name).toEqual('1 Corinthians 13:4-7');
  expect(references.length).toEqual(1);
});

test('should ignore trailing non-matching alphanumeric characters', async () => {
  const references = await getReferencesMatchingName('2 co 3 x y z 1 2 3');
  expect(references[0].name).toEqual('2 Corinthians 3');
  expect(references.length).toEqual(1);
});

test('should recognize accented Unicode characters', async () => {
  const references = await getReferencesMatchingName('é 3', {
    language: 'spa',
    fallbackVersion: 128
  });
  expect(references[0].name).toEqual('Éxodo 3');
  expect(references.length).toEqual(1);
});

test('should normalize Unicode characters', async () => {
  const references = await getReferencesMatchingName('e\u0301');
  expect(references.length).toEqual(0);
});

test('should match numbered books even if book name contains punctuation ', async () => {
  const references = await getReferencesMatchingName('1 ch', {
    language: 'deu',
    fallbackVersion: 51
  });
  expect(references[0].name).toEqual('1. Chronik 1');
  expect(references.length).toEqual(1);
});

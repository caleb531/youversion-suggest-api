import { expect, test } from 'vitest';
import { getReferencesMatchingName } from '../../dist';

test('should recognize shorthand book syntax', async () => {
  const references = await getReferencesMatchingName('1co');
  expect(references[0].name).toEqual('1 Corinthians 1');
  expect(references.length).toEqual(1);
});

test('should recognize shorthand chapter syntax', async () => {
  const references = await getReferencesMatchingName('1 co13');
  expect(references[0].name).toEqual('1 Corinthians 13');
  expect(references.length).toEqual(1);
});

test('should recognize shorthand version syntax', async () => {
  const references = await getReferencesMatchingName('1 co 13esv');
  expect(references[0].name).toEqual('1 Corinthians 13');
  expect(references[0].version.name).toEqual('ESV');
  expect(references.length).toEqual(1);
});

test('should allow shorthand Unicode versions', async () => {
  const references = await getReferencesMatchingName('創世記1:3次經', {
    language: 'zho_tw',
    fallbackVersion: 46
  });
  expect(references[0].name).toEqual('創世記 1:3');
  expect(references.length).toEqual(1);
});

import { expect, test } from 'vitest';
import { getReferencesMatchingName } from '../../src';

test('should match verses', async () => {
  const references = await getReferencesMatchingName('luke 4:8');
  expect(references[0].name).toEqual('Luke 4:8');
  expect(references.length).toEqual(1);
});

test('should match verses by ambiguous book reference', async () => {
  const references = await getReferencesMatchingName('a 3:2');
  expect(references[0].name).toEqual('Amos 3:2');
  expect(references[1].name).toEqual('Acts 3:2');
  expect(references.length).toEqual(2);
});

test('should match verses preceded by dot', async () => {
  const references = await getReferencesMatchingName('luke 4.8');
  expect(references[0].name).toEqual('Luke 4:8');
  expect(references.length).toEqual(1);
});

test('should match verses preceded by space', async () => {
  const references = await getReferencesMatchingName('luke 4 8');
  expect(references[0].name).toEqual('Luke 4:8');
  expect(references.length).toEqual(1);
});

test('should use correct ID for verses', async () => {
  const references = await getReferencesMatchingName('luke 4:8');
  expect(references[0].id).toEqual('111/LUK.4.8');
  expect(references.length).toEqual(1);
});

test('should match verse ranges', async () => {
  const references = await getReferencesMatchingName('1 cor 13.4-7');
  expect(references[0].name).toEqual('1 Corinthians 13:4-7');
  expect(references.length).toEqual(1);
});

test('should use correct ID for verse ranges', async () => {
  const references = await getReferencesMatchingName('1 cor 13.4-7');
  expect(references[0].id).toEqual('111/1CO.13.4-7');
  expect(references.length).toEqual(1);
});

test('should not match nonexistent ranges', async () => {
  const references = await getReferencesMatchingName('1 cor 13.4-3');
  expect(references[0].name).toEqual('1 Corinthians 13:4');
  expect(references.length).toEqual(1);
});

test('should interpret verse zero as verse one', async () => {
  const references = await getReferencesMatchingName('ps 23:0');
  expect(references[0].name).toEqual('Psalms 23:1');
  expect(references.length).toEqual(1);
});

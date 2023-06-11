import test from 'ava';
import { getReferencesMatchingName } from '../../dist';

test('should recognize shorthand book syntax', async (t) => {
  const references = await getReferencesMatchingName('1co');
  t.is(references[0].name, '1 Corinthians 1');
  t.is(references.length, 1);
});

test('should recognize shorthand chapter syntax', async (t) => {
  const references = await getReferencesMatchingName('1 co13');
  t.is(references[0].name, '1 Corinthians 13');
  t.is(references.length, 1);
});

test('should recognize shorthand version syntax', async (t) => {
  const references = await getReferencesMatchingName('1 co 13esv');
  t.is(references[0].name, '1 Corinthians 13');
  t.is(references[0].version.name, 'ESV');
  t.is(references.length, 1);
});

test('should allow shorthand Unicode versions', async (t) => {
  const references = await getReferencesMatchingName('創世記1:3次經', {
    language: 'zho_tw',
    fallbackVersion: 46
  });
  t.is(references[0].name, '創世記 1:3');
  t.is(references.length, 1);
});

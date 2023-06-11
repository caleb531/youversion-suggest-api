import test from 'ava';
import { getReferencesMatchingName } from '../../dist';

test('should match versions ending in number by partial name', async (t) => {
  const references = await getReferencesMatchingName('lucas 4:8 rvr1', {
    language: 'spa',
    fallbackVersion: 128
  });
  t.is(references[0].name, 'Lucas 4:8');
  t.is(references[0].version.name, 'RVR1960');
  t.is(references.length, 1);
});

test('should match versions containing non-ASCII characters', async (t) => {
  const references = await getReferencesMatchingName('路加 4:8 cunp-上', {
    language: 'zho_tw',
    fallbackVersion: 46
  });
  t.is(references[0].name, '路加福音 4:8');
  t.is(references[0].version.name, 'CUNP-上帝');
  t.is(references.length, 1);
});

test('should match versions irrespective of case', async (t) => {
  const query = 'e 4:8 esv';
  const references = await getReferencesMatchingName(query);
  const referencesLower = await getReferencesMatchingName(query.toLowerCase());
  const referencesUpper = await getReferencesMatchingName(query.toUpperCase());
  t.deepEqual(referencesLower, references);
  t.deepEqual(referencesUpper, references);
  t.is(references.length, 6);
});

test('should match versions irrespective of surrounding whitespace', async (t) => {
  const references = await getReferencesMatchingName('1 peter 5:7    esv');
  t.is(references[0].name, '1 Peter 5:7');
  t.is(references[0].version.name, 'ESV');
  t.is(references.length, 1);
});

test('should match versions by partial name', async (t) => {
  const references = await getReferencesMatchingName('luke 4:8 es');
  t.is(references[0].name, 'Luke 4:8');
  t.is(references[0].version.name, 'ESV');
  t.is(references.length, 1);
});

test('should match versions by ambiguous partial name', async (t) => {
  const references = await getReferencesMatchingName('luke 4:8 c');
  t.is(references[0].name, 'Luke 4:8');
  t.is(references[0].version.name, 'CEB');
  t.is(references.length, 1);
});

test('should try to find closest match for nonexistent versions', async (t) => {
  const references = await getReferencesMatchingName('hosea 6:3 nlab');
  t.is(references[0].name, 'Hosea 6:3');
  t.is(references[0].version.name, 'NLT');
  t.is(references.length, 1);
});

test('should match versions by exact name', async (t) => {
  const references = await getReferencesMatchingName('hosea 6:3 amp');
  // Should NOT match AMPC
  t.is(references[0].name, 'Hosea 6:3');
  t.is(references[0].version.name, 'AMP');
  t.is(references.length, 1);
});

test('should use default version for nonexistent versions with no matches', async (t) => {
  const references = await getReferencesMatchingName('hosea 6:3 xyz');
  t.is(references[0].name, 'Hosea 6:3');
  t.is(references[0].version.name, 'NIV');
  t.is(references.length, 1);
});

test('should use default version for nonexistent fallback versions', async (t) => {
  const references = await getReferencesMatchingName('hosea 6:3', {
    language: 'eng',
    fallbackVersion: -123
  });
  t.is(references[0].name, 'Hosea 6:3');
  t.is(references[0].version.name, 'NIV');
  t.is(references.length, 1);
});

test('should use correct ID for versions', async (t) => {
  const references = await getReferencesMatchingName('malachi 3:2 esv');
  t.is(references[0].id, '59/MAL.3.2');
  t.is(references.length, 1);
});

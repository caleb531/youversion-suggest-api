import test from 'ava';
import { getFirstReferenceMatchingName } from '../../dist';

test('should match reference without options', async (t) => {
  const reference = await getFirstReferenceMatchingName('mat 11.28-30');
  t.is(reference.name, 'Matthew 11:28-30');
  t.is(reference.version.name, 'NIV');
});

test('should match reference with options', async (t) => {
  const reference = await getFirstReferenceMatchingName('éx 3.14', {
    language: 'spa',
    fallbackVersion: 'rvc'
  });
  t.is(reference.name, 'Éxodo 3:14');
  t.is(reference.version.name, 'RVC');
});

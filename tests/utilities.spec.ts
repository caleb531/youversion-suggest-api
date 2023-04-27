import { assert, expect } from 'chai';
import { getBibleData, getLanguages, setBibleDataDirBase } from '../src';

describe('utilities', () => {
  it('should set base directory for Bible data directory', async () => {
    setBibleDataDirBase('src');
    expect(await getBibleData()).to.not.be.undefined;
  });

  it('should error when incorrect base directory is set', async () => {
    try {
      setBibleDataDirBase('src/data');
      await getBibleData();
    } catch (error) {
      expect(error).to.be.instanceOf(Error);
      return;
    } finally {
      setBibleDataDirBase('src');
    }
    assert.fail('Error is never thrown for incorrect base directory');
  });

  it('should retrieve list of all languages', async () => {
    const languages = await getLanguages();
    expect(
      languages.find((language) => {
        return language.id === 'eng';
      })
    ).to.have.property('name', 'English');
    expect(languages).to.have.length(27);
  });
});

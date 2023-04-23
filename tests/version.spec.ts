import { expect } from 'chai';
import { getReferencesMatchingName } from '../src';

describe('getReferencesMatchingName', () => {
  it('should match versions ending in number by partial name', async () => {
    const references = await getReferencesMatchingName('lucas 4:8 rvr1', {
      language: 'spa',
      fallbackVersion: 128
    });
    expect(references[0].name).to.equal('Lucas 4:8');
    expect(references[0].version.name).to.equal('RVR1960');
    expect(references).to.have.length(1);
  });

  // TODO: fix this failing test

  // it('should match versions containing non-ASCII characters', async () => {
  //   const references = await getReferencesMatchingName('路加 4:8 cunp-上', {
  //     language: 'zho_tw',
  //     fallbackVersion: 46
  //   });
  //   expect(references[0].name).to.equal('路加福音 4:8');
  //   expect(references[0].version.name).to.equal('CUNP-上帝');
  //   expect(references).to.have.length(1);
  // });

  it('should match versions irrespective of case', async () => {
    const query = 'e 4:8 esv';
    const references = await getReferencesMatchingName(query);
    const referencesLower = await getReferencesMatchingName(query.toLowerCase());
    const referencesUpper = await getReferencesMatchingName(query.toUpperCase());
    expect(referencesLower).to.deep.equal(references);
    expect(referencesUpper).to.deep.equal(references);
    expect(references).to.have.length(6);
  });

  it('should match versions irrespective of surrounding whitespace', async () => {
    const references = await getReferencesMatchingName('1 peter 5:7    esv');
    expect(references[0].name).to.equal('1 Peter 5:7');
    expect(references[0].version.name).to.equal('ESV');
    expect(references).to.have.length(1);
  });

  it('should match versions by partial name', async () => {
    const references = await getReferencesMatchingName('luke 4:8 es');
    expect(references[0].name).to.equal('Luke 4:8');
    expect(references[0].version.name).to.equal('ESV');
    expect(references).to.have.length(1);
  });

  it('should match versions by ambiguous partial name', async () => {
    const references = await getReferencesMatchingName('luke 4:8 c');
    expect(references[0].name).to.equal('Luke 4:8');
    expect(references[0].version.name).to.equal('CEB');
    expect(references).to.have.length(1);
  });

  it('should try to find closest match for nonexistent versions', async () => {
    const references = await getReferencesMatchingName('hosea 6:3 nlab');
    expect(references[0].name).to.equal('Hosea 6:3');
    expect(references[0].version.name).to.equal('NLT');
    expect(references).to.have.length(1);
  });

  it('should match versions by exact name', async () => {
    const references = await getReferencesMatchingName('hosea 6:3 amp');
    // Should NOT match AMPC
    expect(references[0].name).to.equal('Hosea 6:3');
    expect(references[0].version.name).to.equal('AMP');
    expect(references).to.have.length(1);
  });

  it('should use default version for nonexistent versions with no matches', async () => {
    const references = await getReferencesMatchingName('hosea 6:3 xyz');
    expect(references[0].name).to.equal('Hosea 6:3');
    expect(references[0].version.name).to.equal('NIV');
    expect(references).to.have.length(1);
  });

  it('should use correct ID for versions', async () => {
    const references = await getReferencesMatchingName('malachi 3:2 esv');
    expect(references[0]).to.have.property('id', '59/MAL.3.2');
    expect(references).to.have.length(1);
  });
});
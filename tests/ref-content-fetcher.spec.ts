import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { fetchReferenceContent } from '../src';
import { resetRequestMocker, setupRequestMocker } from './testUtilities';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('reference content fetcher', () => {
  beforeAll(async () => {
    setupRequestMocker(
      /https:\/\/www\.bible\.com\/bible/,
      await fs.promises.readFile(path.join(__dirname, 'html', 'psa.23.html'), 'utf8')
    );
  });

  afterAll(() => {
    resetRequestMocker();
  });

  it('should copy reference content for chapter', async () => {
    const reference = await fetchReferenceContent('111/psa.23');
    expect(String(reference.content)).toMatch(/Lorem/);
    expect(String(reference.content)).toMatch(/nunc nulla/);
    expect(String(reference.content)).toMatch(/fermentum/);
  });

  it('should copy reference content for verse', async () => {
    const reference = await fetchReferenceContent('111/psa.23.2');
    expect(String(reference.content)).not.toMatch(/Lorem/);
    expect(String(reference.content)).toMatch(/nunc nulla/);
    expect(String(reference.content)).not.toMatch(/fermentum/);
  });

  it('should copy reference content for verse range', async () => {
    const reference = await fetchReferenceContent('111/psa.23.1-2');
    expect(String(reference.content)).toMatch(/Lorem/);
    expect(String(reference.content)).toMatch(/nunc nulla/);
    expect(String(reference.content)).not.toMatch(/fermentum/);
  });

  it('should be case-insensitive for reference IDs', async () => {
    const reference = await fetchReferenceContent('59/PsA.23');
    expect(reference.name).toEqual('Psalms 23');
  });

  it('should fetch reference content by query', async () => {
    const reference = await fetchReferenceContent('ps 23 esv');
    expect(reference.name).toEqual('Psalms 23');
    expect(reference.version.name).toEqual('ESV');
  });

  it('should throw error for empty content', async () => {
    await expect(async () => {
      await fetchReferenceContent('59/psa.23.11');
    }).rejects.toThrowError('Fetched reference content is empty');
  });

  it('should throw error for query matching nonexistent reference', async () => {
    await expect(async () => {
      await fetchReferenceContent('xyz 23 esv');
    }).rejects.toThrowError('Reference does not exist');
  });

  it('should throw error for nonexistent book ID', async () => {
    await expect(async () => {
      await fetchReferenceContent('111/xyz.23.6');
    }).rejects.toThrowError('xyz is not a valid book ID');
  });

  it('should throw error for nonexistent version ID', async () => {
    await expect(async () => {
      await fetchReferenceContent('0/psa.23.6');
    }).rejects.toThrowError('0 is not a valid version ID');
  });

  it('should provide reference name in returned object', async () => {
    const reference = await fetchReferenceContent('59/psa.23');
    expect(reference.name).toEqual('Psalms 23');
  });

  it('reference name should reflect chosen language', async () => {
    const reference = await fetchReferenceContent('128/psa.23', {
      language: 'spa'
    });
    expect(reference.name).toEqual('Salmo 23');
  });

  it('should handle spaces appropriately', async () => {
    const reference = await fetchReferenceContent('111/psa.23');
    // should respect content consisting of spaces
    expect(String(reference.content)).toMatch(/adipiscing elit./);
    // should collapse consecutive spaces
    expect(String(reference.content)).toMatch(/consectetur adipiscing/);
  });

  it('should add line breaks where appropriate', async () => {
    const reference = await fetchReferenceContent('111/psa.23');
    // should add newline before each p block
    expect(String(reference.content)).toMatch(/amet,\nconsectetur/);
    // should add newline after each p block
    expect(String(reference.content)).toMatch(/erat.\n\n\S/);
    // should add newline between each qc block
    expect(String(reference.content)).toMatch(/orci,\ndapibus/);
    // should add newline between each q block
    expect(String(reference.content)).toMatch(/nec\nfermentum/);
    // should add newlines around each li1 block
    expect(String(reference.content)).toMatch(/elit.\n\nUt/);
    // should add two newlines for each b block
    expect(String(reference.content)).toMatch(/leo,\n\nhendrerit/);
  });

  it('should strip line breaks where appropriate', async () => {
    const reference = await fetchReferenceContent('111/psa.23', {
      includeVerseNumbers: false,
      includeLineBreaks: false
    });
    // should not add newline before each p block
    expect(String(reference.content)).toMatch(/amet, consectetur/);
    // should not add newline after each p block
    expect(String(reference.content)).toMatch(/erat. \S/);
    // should not add newline between each qc block
    expect(String(reference.content)).toMatch(/orci, dapibus/);
    // should not add newline between each q block
    expect(String(reference.content)).toMatch(/nec fermentum/);
    // should not add newlines around each li1 block
    expect(String(reference.content)).toMatch(/elit. Ut/);
    // should not add two newlines for each b block
    expect(String(reference.content)).toMatch(/leo, hendrerit/);
  });

  it('should display verse numbers correctly when stripping line breaks', async () => {
    const reference = await fetchReferenceContent('111/psa.23', {
      includeVerseNumbers: true,
      includeLineBreaks: false
    });
    // should display number for verse 1
    expect(String(reference.content)).toMatch(/\b1 » “Lorem ipsum”/);
    // should display number for verse 2
    expect(String(reference.content)).toMatch(/elit. 2 Ut/);
    // should display number for verse 3
    expect(String(reference.content)).toMatch(/erat. 3 › Nunc/);
    // should display number for verse 4
    expect(String(reference.content)).toMatch(/leo, 4 hendrerit/);
    // should display number for verse 4
    expect(String(reference.content)).toMatch(/leo, 4 hendrerit/);
    // should display number for verse 5
    expect(String(reference.content)).toMatch(/nec 5 fermentum/);
    // should display number for verses 7-9
    expect(String(reference.content)).toMatch(/orci, 7-9 dapibus/);
    // should display number for verse 10
    expect(String(reference.content)).toMatch(/augue in, 10 dictum/);
  });

  it('should display verse numbers correctly with line breaks', async () => {
    const reference = await fetchReferenceContent('111/psa.23', {
      includeVerseNumbers: true,
      includeLineBreaks: true
    });
    expect(String(reference.content)).toMatch(/5 fermentum/);
    expect(String(reference.content)).not.toMatch(/#/);
  });

  it('should handle verse range labels (used by versions like the MSG)', async () => {
    const reference = await fetchReferenceContent('111/psa.23.7-9', {
      includeVerseNumbers: true,
      includeLineBreaks: true
    });
    expect(String(reference.content)).toMatch(/7-9 dapibus et augue in,/);
    expect(String(reference.content)).not.toMatch(/#/);
    expect(String(reference.content)).not.toMatch(/1|2|3|4|5|6|10/);
  });

  it('should handle range labels when verse at start of range is given', async () => {
    const reference = await fetchReferenceContent('111/psa.23.7', {
      includeVerseNumbers: true,
      includeLineBreaks: true
    });
    expect(String(reference.content)).toMatch(/7-9 dapibus et augue in,/);
    expect(String(reference.content)).not.toMatch(/#/);
  });

  it('should handle range labels when verse at end of range is given', async () => {
    const reference = await fetchReferenceContent('111/psa.23.9', {
      includeVerseNumbers: true,
      includeLineBreaks: true
    });
    expect(String(reference.content)).toMatch(/7-9 dapibus et augue in,/);
    expect(String(reference.content)).not.toMatch(/#/);
  });

  it('should handle range labels when verse in middle of range is given', async () => {
    const reference = await fetchReferenceContent('111/psa.23.8', {
      includeVerseNumbers: true,
      includeLineBreaks: true
    });
    expect(String(reference.content)).toMatch(/7-9 dapibus et augue in,/);
    expect(String(reference.content)).not.toMatch(/#/);
  });
});

# YouVersion Suggest for Node

_Copyright 2023 Caleb Evans_  
_Released under the MIT license_

This npm package allow you to search for and fetch Bible content from
YouVersion. It is still under development, so things may break at any time.

## Disclaimer

**This project is not affiliated with YouVersion, and all Bible content is
copyright of the respective publishers.**

## Usage

This API thinks of Bible content in terms of Bible "references". A Bible
reference can be one of three things:

- A chapter (e.g. "Genesis 1")
- A verse (e.g. "Psalm 23:1")
- A range of verses (e.g. "Matthew 11:28-30")

### Fetch content for a Bible reference matching the given query

Fetches the textual content of a Bible chapter, verse, or range of verses. The
first argument is a query which represents the name of the reference you want to
retrieve (can be a full or partial book name).

```ts
import { fetchReferenceContent } from 'youversion-suggest-node';

const content = await fetchReferenceContent('mat 11.28-30', {
  language: 'eng', // Optional
  fallback_version: 'esv', // Optional
  format: '{content}\n- {name} ({version})' // Optional
});
console.log(content);
/*
Come to me, all who labor and are heavy laden, and I will give you rest. Take my yoke upon you, and learn from me, for I am gentle and lowly in heart, and you will find rest for your souls. For my yoke is easy, and my burden is light.”
- Matthew 11:28-30 (ESV)
*/
```

### Retrieve a list of all Bible references matching the given query

The `getReferencesMatchingName()` function retrieves an array of Bible
references whose names match the given query. Please note that these Bible
reference objects do not contain the textual content of the respective
references. If you want the textual content as well, you must fetch it yourself
by calling the above `fetchReferenceContent`.

```ts
import { getReferencesMatchingName } from 'youversion-suggest-node';

const references = await getReferencesMatchingName('a 1:1', {
  language: 'eng'
});
console.log(references);
/*
[
  {
    id: '111/AMO.1.1',
    name: 'Amos 1:1',
    url: 'https://www.bible.com/bible/111/AMO.1.1',
    book: { id: 'amo', name: 'Amos', priority: 129, metadata: [Object] },
    chapter: 1,
    verse: 1,
    endVerse: null,
    version: { full_name: 'New International Version', id: 111, name: 'NIV' }
  },
  {
    id: '111/ACT.1.1',
    name: 'Acts 1:1',
    url: 'https://www.bible.com/bible/111/ACT.1.1',
    book: { id: 'act', name: 'Acts', priority: 143, metadata: [Object] },
    chapter: 1,
    verse: 1,
    endVerse: null,
    version: { full_name: 'New International Version', id: 111, name: 'NIV' }
  }
]
*/
```

### Retrieve the first Bible reference matching the given query

The `getFirstReferenceMatchingName()` function is a convenience function which
effectively returns the first result of the above `getReferencesMatchingName`.
The call signature is exactly the same, only returning a single Bible reference
object rather than an array of said objects.

```ts
import { getFirstReferenceMatchingName } from 'youversion-suggest-node';

const reference = await getFirstReferenceMatchingName('matthew 5:4', {
  language: 'eng',
  fallback_version: 'nkjv'
});
console.log(reference);
/*
{
  id: '114/MAT.5.4',
  name: 'Matthew 5:4',
  url: 'https://www.bible.com/bible/114/MAT.5.4',
  book: {
    id: 'mat',
    name: 'Matthew',
    priority: 139,
    metadata: { canon: 'nt', chapters: 28, verses: [Array] }
  },
  chapter: 5,
  verse: 4,
  endVerse: null,
  version: { full_name: 'New King James Version', id: 114, name: 'NKJV' }
}
*/
```

### Retrieve the Bible data for the specified language

The `getBibleData()` function retrieves a JSON object containing the Bible data
for the specified language code. This Bible data includes the book names of all
66 canonical books of the Bible, a list of the available versions/translations
for that language, and the default version for that language.

```ts
import { getBibleData } from 'youversion-suggest-node';

const bible = await getBibleData('spa');
```

Please see [`bible-eng.json`][bible-json-example] in the
[youversion-suggest-data][yvs-data] repository for an example of how this
returned object is structured.

[bible-json-example]: https://github.com/caleb531/youversion-suggest-data/blob/main/bible/bible-eng.json

### Retrieve metadata for all books in the Biblical canon

This library does not include deuterocanonical Bible data, and therefore uses
the same number of books/chapters across all languages and
versions/translations. You can retrieve this global Bible book metadata using
the `getBibleBookMetadata()` function. It takes no arguments, and returns a
Promise resolving to a key-value store of the metadata.

Please see [book-metadata.json][bible-book-metadata-json] in the
[youversion-suggest-data][yvs-data] repository for an example of how this
returned object is structured.

[bible-book-metadata-json]: https://github.com/caleb531/youversion-suggest-data/blob/main/bible/book-metadata.json
[yvs-data]: https://github.com/caleb531/youversion-suggest-data

### Default Options

Most of the search/lookup functions accept an options object. All of the parameters are optional and have the following defaults:

```ts
{
  language: 'eng',
  version: 'niv',
  fallback_version: 'niv',
  format: '{name} ({version})\n\n{content}'
}
```

# YouVersion Suggest for Node

_Copyright 2023-2024 Caleb Evans_  
_Released under the MIT license_

[![tests](https://github.com/caleb531/youversion-suggest-node/actions/workflows/tests.yml/badge.svg)](https://github.com/caleb531/youversion-suggest-node/actions/workflows/tests.yml)
[![Coverage Status](https://coveralls.io/repos/github/caleb531/youversion-suggest-node/badge.svg?branch=main)](https://coveralls.io/github/caleb531/youversion-suggest-node?branch=main)

This NodeJS library allow you to search for and fetch Bible content from
[YouVersion][youversion].

This library is designed to run in a Node runtime, so it cannot be used in the
browser or (for example) a Cloudflare Worker context. It is also ESM-only; there
is no CommonJS bundle available.

The API is fully typed, so you can easily drop this into your TypeScript
project.

[youversion]: https://www.bible.com/

## Disclaimer

**This library is not compliant with the Terms of Service of YouVersion. Use at your own risk.**

**This project is not affiliated with YouVersion, and all Bible content is copyright of the respective publishers.**

## Attribution

As a courtesy to YouVersion, we kindly ask that you add some kind of attribution
to your application which acknowledges YouVersion as the source of the Bible
content, along with some disclaimer that all Bible content is copyright of the
respective publishers.

## Usage

This API thinks of Bible content in terms of Bible "references". A Bible
reference can be one of three things:

- A chapter (e.g. "Genesis 1")
- A verse (e.g. "Psalm 23:1")
- A range of verses (e.g. "Matthew 11:28-30")

Please also keep in mind that most of the functions below are asynchronous and
return promises instead of the direct values. These promise-returning functions
are identified below as being 'async'; you can also follow each example and look
for the use of the `await` syntax.

### Installation

Using npm (or your preferred package manager):

```sh
npm install youversion-suggest
```

### Fetch content for a Bible reference matching the given query

The async `fetchReferenceContent()` function fetches the textual content of a
Bible chapter, verse, or range of verses. The first argument is a query which
represents the name of the reference you want to retrieve (can be a full or
partial book name).

The returned object represents the Bible reference, and contains a `content`
property which is likely what you want to make use of.

```ts
import { fetchReferenceContent } from 'youversion-suggest';

const reference = await fetchReferenceContent('mat 11.28-30', {
  language: 'eng', // Optional (default: 'eng')
  fallbackVersion: 'esv', // Optional (default: 'niv')
  includeVerseNumbers: true, // Optional (default: false)
  includeLineBreaks: false // Optional (default: true)
});
console.log(reference);
/*
{
  id: '59/MAT.11.28-30'
  name: 'Matthew 11:28-30'
  book: { id: 'mat', name: 'Matthew' },
  chapter: 11,
  verse: 28,
  endVerse: 30,
  version: { id: 59, name: 'ESV', full_name: 'English Standard Version 2016' },
  content: 'Come to me, all who labor and are heavy laden, and I will give you rest. Take my yoke upon you, and learn from me, for I am gentle and lowly in heart, and you will find rest for your souls. For my yoke is easy, and my burden is light.'
}
*/
```

You can then use this returned object to format the verse content however you'd like. For example:

```ts
import { fetchReferenceContent } from 'youversion-suggest';

const reference = await fetchReferenceContent('mat 11.28-30 nlt', {
  language: 'eng', // Optional (default: 'eng')
  fallbackVersion: 'esv' // Optional (default: 'niv')
});
console.log(`${reference.name} (${reference.version.name})\n\n"${reference.content}"`);
/*
Matthew 11:28-30 (NLT)

"Then Jesus said, “Come to me, all of you who are weary and carry heavy burdens, and I will give you rest. Take my yoke upon you. Let me teach you, because I am humble and gentle at heart, and you will find rest for your souls. For my yoke is easy to bear, and the burden I give you is light.”"
*/
```

**Note:** The `fetchReferenceContent()` function actually makes a `fetch()`
request to YouVersion, so it incurs some network latency, and it may possibly
break at any time (due to YouVersion HTML changes).

#### Error cases

- If the Bible reference cannot be fetched because the reference is
  nonexistent, a `BibleReferenceNotFoundError` is thrown
- If the Bible reference cannot be fetched because the content could not be
  parsed, a `BibleReferenceEmptyContentError` error is thrown.

Both of the above error classes inherit from `BibleReferenceError`, and all
three classes are available for import.

### Retrieve a list of all Bible references matching the given query

The async `getReferencesMatchingName()` function retrieves an array of Bible
references whose names match the given query. This query is a case-insensitive
string pattern (not a regex) representing the name of the Bible reference you
are looking for (e.g. `1jo 1:9`, `mat 11.28-30`, `Genesis 1:1`). If the query is
ambiguous, the resulting array will contain multiple references (e.g. `ma 1:1`
matches Malachi 1:1, Mark 1:1, and Matthew 1:1).

```ts
import { getReferencesMatchingName } from 'youversion-suggest';

const references = await getReferencesMatchingName('a 1:1', {
  language: 'eng' // Optional (default: 'eng')
});
console.log(references);
/*
[
  {
    id: '111/AMO.1.1',
    name: 'Amos 1:1',
    url: 'https://www.bible.com/bible/111/AMO.1.1',
    book: { id: 'amo', name: 'Amos' },
    chapter: 1,
    verse: 1,
    endVerse: null,
    version: { full_name: 'New International Version', id: 111, name: 'NIV' }
  },
  {
    id: '111/ACT.1.1',
    name: 'Acts 1:1',
    url: 'https://www.bible.com/bible/111/ACT.1.1',
    book: { id: 'act', name: 'Acts' },
    chapter: 1,
    verse: 1,
    endVerse: null,
    version: { full_name: 'New International Version', id: 111, name: 'NIV' }
  }
]
*/
```

Please note that these returned Bible reference objects do not contain the
textual content of the respective references. If you want the textual content as
well, you must fetch it yourself by calling the aforementioned
`fetchReferenceContent()`.

### Retrieve the first Bible reference matching the given query

The async `getFirstReferenceMatchingName()` function is a convenience function
which effectively returns the first result of the above
`getReferencesMatchingName`. The call signature is exactly the same, only
returning a single Bible reference object rather than an array of said objects.

```ts
import { getFirstReferenceMatchingName } from 'youversion-suggest';

const reference = await getFirstReferenceMatchingName('matthew 5:4', {
  language: 'eng', // Optional (default: 'eng')
  fallbackVersion: 'nkjv' // Optional (default: 'niv')
});
console.log(reference);
/*
{
  id: '114/MAT.5.4',
  name: 'Matthew 5:4',
  url: 'https://www.bible.com/bible/114/MAT.5.4',
  book: {
    id: 'mat',
    name: 'Matthew'
  },
  chapter: 5,
  verse: 4,
  endVerse: null,
  version: { full_name: 'New King James Version', id: 114, name: 'NKJV' }
}
*/
```

### Retrieve a list of all Bible references matching the given phrase

The async `getReferencesMatchingPhrase` function allows you to perform a
freeform search of Bible content matching a particular phrase (e.g. "without
faith" or "son of man"). The return value is an array of Bible references, with
the `content` property of each being the full contents of that particular verse.

```ts
import { getReferencesMatchingPhrase } from 'youversion-suggest';

const references = await getReferencesMatchingPhrase('without faith', {
  language: 'eng', // Optional (default: 'eng')
  version: 'nkjv' // Optional (default: 'niv')
});
console.log(references);
/*
[
  {
    id: '59/HEB.11.6',
    name: 'Hebrews 11:6',
    url: 'https://www.bible.com/bible/59/HEB.11.6',
    book: { id: 'heb', name: 'Hebrews' },
    chapter: 11,
    verse: 6,
    endVerse: null,
    version: { full_name: 'English Standard Version 2016', id: 59, name: 'ESV' },
    content: 'And without faith it is impossible to please him, for whoever would draw near to God  must believe that he exists and  that he rewards those who seek him.'
  },
  // 20 more results...
]
*/
```

The logic behind the search algorithm is black-boxed and internal to YouVersion,
so this package is unable to change it.

### Retrieve the Bible data for the specified language

The async `getBibleData()` function retrieves a JSON object containing the Bible
data for the specified language code. This Bible data includes the book names of
all 66 canonical books of the Bible, a list of the available
versions/translations for that language, and the default version for that
language.

If you call this function without arguments, the default language is `'eng'`.

```ts
import { getBibleData } from 'youversion-suggest';

const bible = await getBibleData('eng');
console.log(bible.books.find((book) => book.id === 'mat')?.name);
// "Matthew"
console.log(bible.versions.find((book) => version.name === 'NLT')?.full_name);
// "New Living Translation"
console.log(bible.default_version);
// 111
```

Please see [`bible-eng.json`][bible-json-example] in the
[youversion-suggest-data][yvs-data] repository for an example of how this
returned object is structured.

[bible-json-example]: https://github.com/caleb531/youversion-suggest-data/blob/main/bible/bible-eng.json

### Retrieve metadata for all books in the Biblical canon

This library does not include deuterocanonical Bible data, and therefore uses
the same number of books/chapters across all languages and
versions/translations. You can retrieve this global Bible book metadata using
the async `getBibleBookMetadata()` function. It takes no arguments, and returns
a key-value store of the metadata; each key is the USFM identifier of a Bible
book (see the [USFM documentation][usfm-docs] for a full list).

[usfm-docs]: https://ubsicap.github.io/usfm/identification/books.html

```ts
import { getBibleBookMetadata } from 'youversion-suggest';

const bookMetadata = await getBibleBookMetadata();
console.log(bookMetadata.psa.canon);
// "ot"
console.log(bookMetadata.psa.chapters);
// 150
console.log(bookMetadata.psa.verses[118]); // Psalm 119
// 176
```

Please see [book-metadata.json][bible-book-metadata-json] in the
[youversion-suggest-data][yvs-data] repository for an example of how this
returned object is structured.

### Retrieve list of all supported languages

The async `getLanguages()` function returns a list of all languages that this
package currently supports. Each language object has two properties: `id` (the
IETF language tag of the language) and `name` (the name of the language as
written in said language).

```ts
import { getLanguages } from 'youversion-suggest';

const languages = await getLanguages();
console.log(languages);
/*
[
  // ...
  {
    "id": "bul",
    "name": "български"
  },
  {
    "id": "deu",
    "name": "Deutsch"
  },
  {
    "id": "eng",
    "name": "English"
  },
  // ...
]
*/
```

### Default Options

Most of the search/lookup functions above accept an options object. All of the
parameters are optional and have the following defaults:

```ts
{
  language: 'eng',
  version: 'niv',
  fallbackVersion: 'niv'
}
```

The values passed to the `version` and `fallbackVersion` options are
case-insensitive (e.g. both `'ESV'` and '`esv'` are accepted). You can also use
the numeric ID of the version for exactness (e.g. `59`, for ESV).

[yvs-data]: https://github.com/caleb531/youversion-suggest-data
[bible-book-metadata-json]: https://github.com/caleb531/youversion-suggest-data/blob/main/bible/book-metadata.json

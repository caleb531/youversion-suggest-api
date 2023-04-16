# YouVersion Suggest for Node

_Copyright 2023 Caleb Evans_  
_Released under the MIT license_

This npm package allow you to search for and fetch Bible content from
YouVersion. It is still under development, so things may break at any time.

## Disclaimer

This project is not affiliated with YouVersion, and all Bible content is
copyright of the respective publishers.

## Usage

This API thinks of Bible content in terms of Bible "references". A Bible reference is simply one of three things:

- A chapter
- A verse
- A range of verses

### Fetch content for a Bible reference matching the given name

Retrieves the

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

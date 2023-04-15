import { fetchReferenceContent } from './src/ref-content-fetcher';

async function main() {
  console.log(
    await fetchReferenceContent('mat 4:1', {
      language: 'eng',
    })
  );
}
main();

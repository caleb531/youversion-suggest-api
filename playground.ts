import { fetchReferenceContent } from './src/ref-content-fetcher';

async function main() {
  console.log(
    await fetchReferenceContent('psa.23.1', {
      language: 'eng',
    })
  );
}
main();

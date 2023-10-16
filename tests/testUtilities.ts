import fetchMock from 'fetch-mock';
import nock from 'nock';

// A helper function used to mock the Fetch API, whether native fetch() is
// available or node-fetch is being used instead
export function mockFetch(html: string): void {
  nock.disableNetConnect();
  nock('https://www.bible.com')
    .persist()
    .get(/^\/bible/)
    .reply(200, html);
  fetchMock.mock(/\/bible/, html);
}

// Completely reset all fetch() mocks (including node-fetch) to their original
// implementation
export function resetFetch(): void {
  fetchMock.resetBehavior();
  nock.cleanAll();
  nock.enableNetConnect();
}

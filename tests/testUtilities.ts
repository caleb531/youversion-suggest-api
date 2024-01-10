import nock from 'nock';
import { vi } from 'vitest';
import createFetchMock from 'vitest-fetch-mock';

const fetchMock = createFetchMock(vi);

// A helper function used to mock the Fetch API, whether native fetch() is
// available or node-fetch is being used instead
export function mockFetch(html: string): void {
  nock.disableNetConnect();
  nock('https://www.bible.com')
    .persist()
    .get(/\/bible/)
    .reply(200, html);
  fetchMock.mockIf(/\/bible/, () => {
    return html;
  });
}

// Completely reset all fetch() mocks (including node-fetch) to their original
// implementation
export function resetFetch(): void {
  fetchMock.resetMocks();
  nock.cleanAll();
  nock.enableNetConnect();
}

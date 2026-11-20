import { http, HttpResponse } from 'msw';
import { setupServer, SetupServer } from 'msw/node';

let server: SetupServer;

// A helper function used to mock network requests via Mock Service Worker (MSW)
export function setupRequestMocker(urlPattern: string | RegExp, html: string): void {
  server = setupServer(
    http.get(urlPattern, () => {
      return HttpResponse.text(html);
    })
  );
  server.listen();
}

// Completely reset MSW  and reset all handlers
export function resetRequestMocker(): void {
  server.resetHandlers();
  server.close();
}

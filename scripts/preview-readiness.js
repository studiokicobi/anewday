import { stripVTControlCharacters } from 'node:util';

// Vite colors the port separately in CI, and a pipe can split the URL or an
// ANSI sequence across chunks. Only recognize this child's complete URL.
export function createPreviewReadyMatcher(port) {
  const url = `http://127.0.0.1:${port}/`;
  let output = '';
  return (chunk) => {
    output = (output + String(chunk)).slice(-8192);
    return stripVTControlCharacters(output).includes(url);
  };
}

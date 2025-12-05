import "@testing-library/jest-dom";

// Polyfill for TextEncoder/TextDecoder (required by Solana libraries)
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

// Polyfill for structuredClone (required by Anchor)
if (typeof global.structuredClone === "undefined") {
  global.structuredClone = (obj: unknown) => JSON.parse(JSON.stringify(obj));
}

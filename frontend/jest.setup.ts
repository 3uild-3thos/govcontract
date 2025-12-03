import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// Polyfills for Solana web3.js
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as typeof global.TextDecoder;

import '@testing-library/jest-dom';


// Polyfill TextEncoder / TextDecoder for jsdom
import { TextEncoder, TextDecoder } from "util";
(global as any).TextEncoder = TextEncoder;
(global as any).TextDecoder = TextDecoder as any;

// Optional if some tests actually use fetch:
import "whatwg-fetch";
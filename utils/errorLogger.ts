import { LogBox } from 'react-native';

const MUTED_MESSAGES = [
  'Require cycle:',
  'VirtualizedLists should never be nested',
  'Sending `onAnimatedValueUpdate` with no listeners registered',
  'Non-serializable values were found in the navigation state',
  'AsyncStorageError',
  'Native module is null',
  '[Theme] Error loading theme',
  '[Theme] Error saving theme',
  'SecureStore',
  'java.io.IOException: Failed to download remote update',
  'Request timed out',
  'SSL',
  'certificate',
  'handshake',
  'TLS',
  'CERT',
  'Failed to fetch',
  'network error',
  'NSURLSession',
  'NSError',
  'CFNetwork',
  'kCFStreamErrorDomain',
  'Connection security error',
  'Unable to connect to server',
  'Cloudflare',
  'Connection error',
  '[API] Error loading',
  'Authentication token not found',
  'Please sign in',
  // You can add the unique key warning here if you want to silence it, 
  // though fixing it in the UI like we did earlier is always better!
  'Each child in a list should have a unique "key" prop' 
];

// 1. THIS IS THE MAGIC BULLET FOR iOS/ANDROID SCREENS
// This tells React Native's built-in UI to ignore these specific warnings/errors
LogBox.ignoreLogs(MUTED_MESSAGES);

// 2. Helper to safely parse arguments (handles Objects and Errors, not just Strings)
export function shouldMuteMessage(args: any[]): boolean {
  if (!args || args.length === 0) return false;
  
  // Safely stringify everything in the console log payload
  const message = args.map(arg => {
    if (typeof arg === 'string') return arg;
    if (arg instanceof Error) return arg.message;
    try {
      return JSON.stringify(arg);
    } catch (e) {
      return String(arg);
    }
  }).join(' ').toLowerCase();

  return MUTED_MESSAGES.some(muted => message.includes(muted.toLowerCase()));
}

// 3. Keep your terminal overrides for a clean console
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

console.error = (...args: any[]) => {
  if (!shouldMuteMessage(args)) {
    originalConsoleError(...args);
  }
};

console.warn = (...args: any[]) => {
  if (!shouldMuteMessage(args)) {
    originalConsoleWarn(...args);
  }
};

console.log = (...args: any[]) => {
  if (!shouldMuteMessage(args)) {
    originalConsoleLog(...args);
  }
};

export default {
  shouldMuteMessage,
};
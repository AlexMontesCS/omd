import * as mathjs from 'mathjs';

const globalScope = (() => {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof window !== 'undefined') return window;
  if (typeof global !== 'undefined') return global;
  return undefined;
})();

if (globalScope && !globalScope.math) {
  try {
    globalScope.math = mathjs;
  } catch (_) {
    // Silently ignore if the global object is not writable.
  }
}

export const math = mathjs;
export default mathjs;

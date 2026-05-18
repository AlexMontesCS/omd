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
    // Ignore read-only global environments.
  }
}

export const math = globalScope?.math || mathjs;
export default math;

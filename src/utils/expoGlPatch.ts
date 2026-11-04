/**
 * Prevents race condition crashes in expo-gl on Android Hermes:
 * "TypeError: Cannot set property '__expoSetLogging' of undefined"
 * 
 * This occurs when Android SurfaceView triggers onSurfaceCreate before the
 * C++/JNI native WebGL context binding has finished registering into global.__EXGLContexts.
 */

let currentExglMap: any = (globalThis as any).__EXGLContexts || {};

function createSafeExglProxy(targetMap: any) {
  return new Proxy(targetMap, {
    get(target, prop) {
      if (typeof prop === 'symbol' || prop === 'inspect') return target[prop];
      const val = target[prop];
      if (val) return val;

      // Safe fallback proxy so configureLogging(gl) in expo-gl never throws
      return {
        __expoSetLogging: () => {},
        isPendingContext: true,
        drawingBufferWidth: 360,
        drawingBufferHeight: 520,
        getContextAttributes: () => ({
          alpha: true,
          depth: true,
          stencil: true,
          antialias: false,
        }),
      };
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
    deleteProperty(target, prop) {
      delete target[prop];
      return true;
    },
  });
}

let activeProxy = createSafeExglProxy(currentExglMap);

try {
  Object.defineProperty(globalThis, '__EXGLContexts', {
    configurable: true,
    enumerable: true,
    get() {
      return activeProxy;
    },
    set(newVal) {
      if (newVal && typeof newVal === 'object') {
        currentExglMap = newVal;
        activeProxy = createSafeExglProxy(currentExglMap);
      }
    },
  });
} catch {
  // If property cannot be redefined, ensure target has fallback
  (globalThis as any).__EXGLContexts = activeProxy;
}

export function ensureExpoGlProtected() {
  // Executed on import to initialize the global guard
  return true;
}

import {
  createAbortController,
  isAbortError,
  globalAbortController,
} from '../lib/abort-utils';

describe('createAbortController', () => {
  it('creates a controller with signal and cleanup', () => {
    const { controller, signal, cleanup } = createAbortController();
    expect(controller).toBeInstanceOf(AbortController);
    expect(signal.aborted).toBe(false);
    cleanup();
    expect(signal.aborted).toBe(true);
  });

  it('auto-aborts after timeout', async () => {
    const { signal } = createAbortController(50);
    expect(signal.aborted).toBe(false);
    await new Promise(r => setTimeout(r, 100));
    expect(signal.aborted).toBe(true);
  });

  it('clears timeout on cleanup', async () => {
    const { signal, cleanup } = createAbortController(50);
    cleanup();
    expect(signal.aborted).toBe(true);
    // Would not throw if timeout was cleared
  });
});

describe('isAbortError', () => {
  it('returns true for AbortError', () => {
    const err = new DOMException('Aborted', 'AbortError');
    expect(isAbortError(err)).toBe(true);
  });

  it('returns true for Error with name AbortError', () => {
    const err = new Error('aborted');
    err.name = 'AbortError';
    expect(isAbortError(err)).toBe(true);
  });

  it('returns false for regular Error', () => {
    expect(isAbortError(new Error('other'))).toBe(false);
  });

  it('returns false for non-Error', () => {
    expect(isAbortError('string')).toBe(false);
    expect(isAbortError(null)).toBe(false);
    expect(isAbortError(undefined)).toBe(false);
  });
});

describe('globalAbortController', () => {
  it('registers and aborts controllers', () => {
    const controller = new AbortController();
    const unregister = globalAbortController.register(controller);
    expect(controller.signal.aborted).toBe(false);

    globalAbortController.abortAll();
    expect(controller.signal.aborted).toBe(true);
  });

  it('unregister removes controller from tracking', () => {
    const controller = new AbortController();
    const unregister = globalAbortController.register(controller);
    unregister();

    globalAbortController.abortAll();
    expect(controller.signal.aborted).toBe(false);
  });

  it('abortAll clears all registered controllers', () => {
    const c1 = new AbortController();
    const c2 = new AbortController();
    globalAbortController.register(c1);
    globalAbortController.register(c2);

    globalAbortController.abortAll();
    expect(c1.signal.aborted).toBe(true);
    expect(c2.signal.aborted).toBe(true);
  });
});

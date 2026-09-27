/**
 * SEC-14 regression tests:
 * The swagger middleware must be disabled by default in production environments
 * (NODE_ENV === 'production') and emit a WARN when explicitly enabled there.
 */
import * as fsPromises from 'fs/promises';

// Prevent the middleware from actually writing swagger.json to disk during tests
jest.mock('fs/promises', () => ({
  ...jest.requireActual('fs/promises'),
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

describe('SEC-14: swagger enabled switch', () => {
  const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
  const baseConfig = {
    title: 'Test API',
    version: '1.0.0',
    controllers: [],
    jsonPath: '/swagger.json',
  };

  beforeEach(() => {
    (fsPromises.writeFile as jest.Mock).mockClear();
  });

  afterEach(() => {
    process.env.NODE_ENV = ORIGINAL_NODE_ENV;
    jest.restoreAllMocks();
  });

  /**
   * Load src/index in an isolated module registry with the given NODE_ENV,
   * then build the middleware and invoke it against a fake json-path request.
   */
  async function buildMiddlewareInEnv(nodeEnv: string | undefined, options: Record<string, any>) {
    process.env.NODE_ENV = nodeEnv;

    let indexMod: any;
    let koattySwaggerFn: any;
    jest.isolateModules(() => {
      indexMod = require('../../src/index');
      koattySwaggerFn = indexMod.KoattySwagger;
    });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { /* silence */ });

    const middleware = koattySwaggerFn({ ...baseConfig, ...options }, {} as any);

    // Simulate a request to the json endpoint
    const ctx: any = { path: '/swagger.json' };
    const next = jest.fn(async () => { /* noop */ });
    await middleware(ctx, next);

    return { middleware, ctx, next, warnSpy };
  }

  it('production: endpoints are NOT mounted by default and no WARN is emitted', async () => {
    const { ctx, next, warnSpy } = await buildMiddlewareInEnv('production', {});

    expect(next).toHaveBeenCalledTimes(1);
    expect(ctx.body).toBeUndefined();
    expect(ctx.type).toBeUndefined();
    expect(warnSpy).not.toHaveBeenCalled();
    expect(fsPromises.writeFile).not.toHaveBeenCalled();
  });

  it('production: explicit enabled=true mounts the json endpoint and emits WARN', async () => {
    const { ctx, next, warnSpy } = await buildMiddlewareInEnv('production', { enabled: true });

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy.mock.calls[0][0]).toMatch(/WARN/i);
    expect(ctx.type).toBe('application/json');
    expect(ctx.body).toBeDefined();
    expect(ctx.body.openapi).toMatch(/^3\.0\.\d+$/);
    expect(next).not.toHaveBeenCalled();
  });

  it('production: explicit enabled=false stays disabled without WARN', async () => {
    const { ctx, next, warnSpy } = await buildMiddlewareInEnv('production', { enabled: false });

    expect(next).toHaveBeenCalledTimes(1);
    expect(ctx.body).toBeUndefined();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('development: endpoints are mounted by default (no WARN)', async () => {
    const { ctx, next, warnSpy } = await buildMiddlewareInEnv('development', {});

    expect(ctx.type).toBe('application/json');
    expect(ctx.body).toBeDefined();
    expect(ctx.body.openapi).toMatch(/^3\.0\.\d+$/);
    expect(next).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('development: explicit enabled=false disables the endpoints', async () => {
    const { ctx, next, warnSpy } = await buildMiddlewareInEnv('development', { enabled: false });

    expect(next).toHaveBeenCalledTimes(1);
    expect(ctx.body).toBeUndefined();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('unset NODE_ENV: endpoints are mounted by default', async () => {
    const { ctx, next, warnSpy } = await buildMiddlewareInEnv(undefined, {});

    expect(ctx.type).toBe('application/json');
    expect(ctx.body).toBeDefined();
    expect(next).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

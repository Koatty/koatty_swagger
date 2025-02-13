import { generateSpec } from './test-utils';

describe('@ApiHeader 装饰器', () => {
  const spec: any = generateSpec();
  const pathKey = Object.keys(spec.paths).find(k => k.startsWith('/test/'));
  const testPath = spec.paths[pathKey!];

  test('类级Header应用到所有方法', () => {
    const commonHeader = testPath.get.parameters.find(
      p => p.name === 'X-Common-Header'
    );

    expect(commonHeader).toEqual({
      name: 'X-Common-Header',
      in: 'header',
      description: '通用请求头',
      required: true,
      schema: { type: 'string' }
    });
  });

  test('方法级Header合并到特定操作', () => {
    const methodHeaders = testPath.get.parameters
      .filter(p => p.in === 'header')
      .map(p => p.name);

    expect(methodHeaders).toEqual(
      expect.arrayContaining(['X-Common-Header', 'X-Custom-Header'])
    );
  });

  test('安全方案集成', () => {
    // 验证安全方案定义
    expect(spec.components.securitySchemes).toHaveProperty('X-API-KEY');
    expect(spec.components.securitySchemes['X-API-KEY']).toEqual({
      type: 'apiKey',
    });

    // 验证操作级安全要求
    const pathKey = Object.keys(spec.paths).find(k => k.includes('/secured'));
    const testPath = spec.paths[pathKey!];
    const securedOp = testPath.get;
    expect(securedOp.security).toEqual([
      { 'X-API-KEY': [] }
    ]);
  });

  test('Header覆盖逻辑', () => {
    const pathKey = Object.keys(spec.paths).find(k => k.includes('/override'));
    const testPath = spec.paths[pathKey!];
    const overriddenHeader = testPath.get.parameters.find(
      p => p.name === 'X-Common-Header' && p.required === false
    );

    expect(overriddenHeader.description).toBe('覆盖后的描述');
    expect(overriddenHeader.required).toBe(false);
  });

  test('多方法独立Header作用域', () => {
    const postMethodHeaders = testPath.post?.parameters || [];
    expect(postMethodHeaders.some(p => p.name === 'X-Custom-Header')).toBe(false);
  });
});

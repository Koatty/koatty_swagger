import { generateSpec } from './test-utils';

describe('@ApiParam 装饰器', () => {
  const spec: any = generateSpec();

  test('路径参数默认required', () => {
    const usersPath = spec.paths['/users/test/{id}'];
    const param = usersPath.get.parameters.find(p => p.name === 'id');
    expect(param.required).toBe(true);
    expect(param.schema).toEqual({ type: 'number' });
    expect(param.description).toBe('用户ID');
  });

  test('自定义schema覆盖type', () => {
    const usersPath = spec.paths['/users/test/{id}'];
    const param = usersPath.put.parameters.find(p => p.name === 'id');
    expect(param.schema).toEqual({
      type: 'string',
      pattern: '^\\d+$'
    });
  });

  test('数组参数共存', () => {
    const usersPath = spec.paths['/users/test/search'];
    const searchParams = usersPath.get.parameters;
    expect(searchParams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'keywords',
          in: 'query',
          required: true,
          schema: { type: 'string' }
        }),
        expect.objectContaining({
          name: 'X-Trace-ID',
          in: 'header',
          schema: { type: 'string' }
        })
      ])
    );
  });

  test('类型自动转换', () => {
    const usersPath = spec.paths['/users/test/{id}/avatar'];
    const boolParam = usersPath.post.parameters.find(p => p.name === 'compress');
    expect(boolParam.schema).toEqual({ type: 'boolean' });
  });

  test('body参数特殊处理', () => {
    const usersPath = spec.paths['/users/test/{id}/avatar'];
    expect(usersPath?.post?.requestBody).toEqual({
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: { title: { type: 'string' } }
          }
        }
      }
    });
  });
});

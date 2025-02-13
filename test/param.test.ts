import { generateSpec } from './test-utils';

describe('@ApiParam 装饰器', () => {
  const spec: any = generateSpec();
  const usersPath = spec.paths['/users'];

  test('路径参数默认required', () => {
    const param = usersPath.get.parameters.find(p => p.name === 'id');
    expect(param.required).toBe(true);
    expect(param.schema).toEqual({ type: 'number' });
    expect(param.description).toBe('用户ID');
  });

  test('自定义schema覆盖type', () => {
    const param = usersPath.put.parameters.find(p => p.name === 'id');
    expect(param.schema).toEqual({
      type: 'string',
      pattern: '^\\d+$'
    });
  });

  test('多位置参数共存', () => {
    const searchParams = usersPath.get.parameters;
    expect(searchParams).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'keywords',
          in: 'query',
          required: true,
          schema: { type: 'string', minLength: 2 }
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
    const boolParam = usersPath.post.parameters.find(p => p.name === 'compress');
    expect(boolParam.schema).toEqual({ type: 'boolean' });
  });

  test('路径参数验证', () => {
    const invalidParams = () => {
      @ApiController('/test')
      class InvalidController {
        @ApiOperation({ method: 'GET', path: '/{id}' })
        @ApiParam({
          name: 'id',  // 与路径参数名匹配
          in: 'query'  // 错误的位置
        })
        invalidMethod() { }
      }
      generateSpec();
    };

    expect(invalidParams).toThrow('路径参数id必须使用in:"path"');
  });

  test('body参数特殊处理', () => {
    @ApiController('/posts')
    class PostController {
      @ApiOperation({ method: 'POST', path: '/' })
      @ApiParam({
        name: 'payload',
        in: 'body',
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string' }
          }
        }
      })
      createPost() { }
    }

    const spec = generateSpec();
    const requestBody = spec.paths['/posts/'].post.requestBody;
    expect(requestBody).toEqual({
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

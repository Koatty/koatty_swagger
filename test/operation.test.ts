import { generateSpec } from './test-utils';

describe('@ApiOperation 装饰器', () => {
  const spec = generateSpec();
  const paths: any = spec.paths;

  test('基本路径和方法配置', () => {
    expect(paths['/users']).toHaveProperty('get');
    expect(paths['/users']).toHaveProperty('post');
    expect(paths['/users/{id}']).toHaveProperty('delete');
    expect(paths['/users/{id}/profile']).toHaveProperty('put');
  });

  test('操作元数据完整性', () => {
    const getOp = paths['/users'].get;
    expect(getOp).toMatchObject({
      summary: '获取用户列表',
      tags: ["User Management", "user"],
      responses: {},
      parameters: []
    });

    const postOp = paths['/users'].post;
    expect(postOp).toMatchObject({
      description: '创建新用户',
      tags: ["User Management", "admin", "user",],
      responses: {},
      parameters: []
    });
  });

  test('弃用标记处理', () => {
    const detailOp = paths['/users/detail/{id}'].get;
    expect(detailOp.deprecated).toBe(true);
  });

  // test('路径参数自动识别', () => {
  //   const detailOp = paths['/users/{id}'].get;
  //   expect(detailOp.parameters).toMatchObject([{
  //     name: 'id',
  //     in: 'path',
  //     required: true,
  //     schema: { type: 'string' }
  //   }]);
  // });

  test('标签去重和排序', () => {
    const postOp = paths['/users'].post;
    expect(postOp.tags).toEqual(["User Management", "admin", "user"]);
  });

  test('多方法同路径支持', () => {
    const userRoot = paths['/users'];
    expect(Object.keys(userRoot)).toEqual(['get', 'post']);
  });

  test('最小化配置支持', () => {
    const profileOp = paths['/users/{id}/profile'].put;
    expect(profileOp).toMatchObject({
      tags: ['User Management', 'user'],
      responses: {},
      parameters: []
    });
  });
});

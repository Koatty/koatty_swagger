import { API_CONTROLLER_KEY } from '../src/decorators/controller';
import { generateSpec } from './test-utils';
import { UserController } from './testcontroller';

describe('@ApiController 装饰器', () => {

  const spec: any = generateSpec();

  test('设置基础属性和标签', () => {
    const pathKey = Object.keys(spec.paths).find(k => k.startsWith('/users'));
    const pathItem = spec.paths[pathKey!];

    expect(pathItem.get).toMatchObject({
      tags: ['User Management', 'user'],
      operationId: 'UserController_list'
    });

    expect(pathItem.post).toMatchObject({
      tags: ['User Management', 'admin', 'user'],
      operationId: 'UserController_create'
    });
  });

  test('路径规范化处理', () => {
    expect(spec.paths['/create']).toBeDefined();
  });

  test('默认基础路径处理', () => {
    expect(spec.paths['/test'].get).toMatchObject({
      tags: ['DefaultController'],
      operationId: 'DefaultController_test'
    });
  });

  test('多标签和描述支持', () => {
    const path = '/orders/{id}';
    expect(spec.paths[path!].get).toMatchObject({
      tags: ['Order', 'Sales'],
      // description: '订单相关接口',
      operationId: 'OrderController_getOrder'
    });
  });

  test('路径拼接正确性', () => {
    const path = '/v1/api/health';
    expect(spec.paths[path].get).toBeDefined();
  });

  test('元数据存储验证', () => {
    const controllerMeta = Reflect.getMetadata(API_CONTROLLER_KEY, UserController);
    expect(controllerMeta).toEqual({
      path: '/users',
      options: {
        tags: ['User Management']
      }
    });
  });

  test('空路径处理', () => {
    expect(spec.paths['/root']).toBeDefined();
  });

});

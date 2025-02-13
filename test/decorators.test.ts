import 'reflect-metadata';
import { API_CONTROLLER_KEY } from '../src/decorators/controller';
import { API_MODEL_KEY, ApiModel, getRegisteredModels } from '../src/decorators/model';
import { API_OPERATION_KEY } from '../src/decorators/operation';
import { API_PARAMETERS_KEY } from '../src/decorators/params';
import { API_PROPERTIES_KEY } from '../src/decorators/property';
import { TestController } from './testcontroller';
import { CreateUserDto, UserDetailDto } from './testdto';


describe('装饰器元数据测试', () => {



  test('Controller装饰器注册元数据', () => {
    const path = Reflect.getMetadata(API_CONTROLLER_KEY, TestController);

    expect(path).toBe('/api');
  });

  test('HTTP方法装饰器记录元数据', () => {
    const getMethod = Reflect.getMetadata(API_OPERATION_KEY, TestController.prototype, 'getUsers');
    const postMethod = Reflect.getMetadata(API_OPERATION_KEY, TestController.prototype, 'createUser');

    expect(getMethod).toHaveProperty('method', 'get');
    expect(getMethod).toHaveProperty('path', '/users');
    expect(getMethod).toHaveProperty('summary', '获取用户列表');
    expect(postMethod).toHaveProperty('method', 'post');
    expect(postMethod).toHaveProperty('path', '/users');
    expect(postMethod).toHaveProperty('summary', '创建用户');
  });

  test('参数装饰器生成描述', () => {
    const queryParams = Reflect.getMetadata(API_PARAMETERS_KEY, TestController.prototype, 'getUsers');
    const bodyParams = Reflect.getMetadata(API_PARAMETERS_KEY, TestController.prototype, 'createUser');

    expect(queryParams).toEqual([{ in: 'query', name: 'page', required: true, type: 'number' }]);
    expect(bodyParams).toEqual([{ in: 'body', name: 'user', "$ref": "#/components/schemas/CreateUserDto" }]);
  });

  test('元数据存储正确', () => {
    const meta = Reflect.getMetadata(API_MODEL_KEY, UserDetailDto);
    expect(meta).toEqual({
      "description": "用户详细信息",
      name: 'UserDetailDto',
      inherit: true
    });
  });

  test('继承关系处理', () => {
    @ApiModel()
    class Parent { }

    @ApiModel()
    class Child extends Parent { }

    expect(getRegisteredModels()).toEqual(
      expect.arrayContaining([Parent, Child])
    );
  });


  test('自定义模型名称', () => {
    const meta = Reflect.getMetadata('swagger:model', CreateUserDto);
    expect(meta.name).toBe('CreateUser');
  });

  test('DTO模型生成Schema', () => {
    const props = Reflect.getMetadata(API_PROPERTIES_KEY, CreateUserDto);
    expect(props).toEqual([{ "format": "uuid", "name": "id", "type": "string" }, { "format": "date-time", "name": "createdAt", "type": "string" }, { "name": "name", "type": "string" },
    { "name": "age", "type": "string" }, { "$ref": "#/components/schemas/UserDetailDto", "name": "detail", "type": "object" }]);
    // expect(props[1]).toEqual({ name: 'age', type: 'integer' });
  });
});
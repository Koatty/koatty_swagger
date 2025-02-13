import { OpenAPIObject } from 'openapi3-ts/oas31';
import { generateOpenAPIDoc } from "../src/index";
import { TestController } from './testcontroller';

describe('OpenAPI 文档集成测试', () => {
  let spec: OpenAPIObject;

  // beforeAll(async () => {

  //   await SwaggerParser.validate(spec as any);
  // });

  test('符合OpenAPI 3.0规范', () => {
    const config = {
      title: '测试文档',
      version: '1.0.0',
      controllers: [TestController],
    }
    spec = generateOpenAPIDoc(config); // 假设的测试控制器
    console.log(JSON.stringify(spec, null, 2));
    expect(spec.openapi).toMatch(/^3\.0\.\d+$/);
  });

  // test('路径参数正确映射', () => {
  //   const path = spec.paths['/api/users'];
  //   expect(path.get.parameters).toContainEqual({
  //     in: 'query',
  //     name: 'page',
  //     required: true,
  //     schema: { type: 'number' }
  //   });
  // });

  // test('请求体结构正确', () => {
  //   const requestBody = spec.paths['/api/users'].post.requestBody;
  //   expect(requestBody.content['application/json'].schema).toEqual({
  //     $ref: '#/components/schemas/CreateUserDto'
  //   });
  // });

  // test('响应状态码正确', () => {
  //   const responses = spec.paths['/api/users'].get.responses;
  //   expect(responses['200'].description).toBe('Success');
  //   expect(responses['404']).toBeUndefined(); // 测试默认响应
  // });

  // test('组件Schema包含DTO定义', () => {
  //   expect(spec.components.schemas).toHaveProperty('CreateUserDto');
  //   expect(spec.components.schemas.CreateUserDto).toEqual({
  //     type: 'object',
  //     required: ['name', 'age'],
  //     properties: {
  //       name: { type: 'string' },
  //       age: { type: 'integer' }
  //     }
  //   });
  // });
});
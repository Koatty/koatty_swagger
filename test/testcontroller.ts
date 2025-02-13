import { ApiController } from "../src/decorators/controller";
import { ApiHeader, SecurityScheme } from "../src/decorators/header";
import { ApiOperation } from "../src/decorators/operation";
import { ApiParam } from "../src/decorators/param";

const securityScheme: SecurityScheme = {
  type: 'apiKey',
  name: 'X-API-KEY',
};

// 测试控制器定义
@ApiController('/test')
@ApiHeader({
  name: 'X-Common-Header',
  description: '通用请求头',
  required: true
})
export class TestController {
  @ApiOperation({ method: 'GET', path: '/basic' })
  @ApiHeader({
    name: 'X-Custom-Header',
    description: '自定义头'
  })
  basicMethod() { }

  @ApiOperation({ method: 'GET', path: '/secured' })
  @ApiHeader({
    name: 'X-Auth',
    description: '认证头',
    securityScheme: securityScheme
  })
  securedMethod() { }

  @ApiOperation({ method: 'GET', path: '/override' })
  @ApiHeader({
    name: 'X-Common-Header', // 覆盖类级同名header
    required: false,
    description: '覆盖后的描述'
  })
  overrideMethod() { }

  @ApiOperation({ method: 'POST', path: '/post' })
  @ApiHeader({
    name: 'X-Post-Header',
    description: 'POST请求头'
  })
  postMethod() { }
}

// 测试基础路径和标签功能
@ApiController('/users', { tags: ['User Management'] })
export class UserController {
  @ApiOperation({
    method: 'GET',
    path: '/',
    summary: '获取用户列表',
    tags: ['user']
  })
  list() { }

  @ApiOperation({
    method: 'POST',
    path: '/',
    description: '创建新用户',
    tags: ['admin', 'user']
  })
  create() { }

  @ApiOperation({
    method: 'GET',
    path: '/detail/{id}',
    summary: '获取用户详情',
    deprecated: true
  })
  detail() { }

  @ApiOperation({
    method: 'PUT',
    path: '/{id}/profile',
    tags: ['user']
  })
  updateProfile() { }

  @ApiOperation({
    method: 'DELETE',
    path: '/{id}',
    summary: '删除用户',
    description: '软删除用户记录'
  })
  delete() { }

  @ApiOperation({ method: 'GET', path: '/test/{id}' })
  @ApiParam({
    name: 'id',
    in: 'path',
    description: '用户ID',
    type: Number
  })
  getById() { }

  @ApiOperation({ method: 'GET', path: '/test/search' })
  @ApiParam([{
    name: 'keywords',
    in: 'query',
    required: true,
    schema: {
      type: 'string'
    }
  },
  {
    name: 'X-Trace-ID',
    in: 'header',
    description: '追踪标识'
  }])
  search() { }

  @ApiOperation({ method: 'POST', path: '/test/{id}/avatar' })
  @ApiParam([{ name: 'id', in: 'path' },
  {
    name: 'compress',
    in: 'query',
    type: Boolean
  },
  {
    name: 'payload',
    in: 'body',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' }
      }
    }
  }])
  uploadAvatar() { }

  @ApiOperation({ method: 'PUT', path: '/test/{id}' })
  @ApiParam({
    name: 'id',
    in: 'path',
    schema: {
      type: 'string',
      pattern: '^\\d+$'
    }
  })
  updateUser() { }
}

// 测试默认配置
@ApiController("//")
export class DefaultController {
  @ApiOperation({ method: 'GET', path: '/test' })
  test() { }

  @ApiOperation({ method: 'POST', path: '//create' })
  create() { }
}

// 测试多标签和描述
@ApiController('/orders', {
  tags: ['Order', 'Sales'],
  description: '订单相关接口'
})
export class OrderController {
  @ApiOperation({ method: 'GET', path: '/{id}', summary: '获取订单' })
  getOrder() { }
}

@ApiController('/v1/api')
export class VersionedController {
  @ApiOperation({ method: 'GET', path: '/health' })
  healthCheck() { }
}

@ApiController('')
export class EmptyPathController {
  @ApiOperation({ method: 'GET', path: '/root' })
  root() { }
}
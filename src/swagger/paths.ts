/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2025-02-11 11:27:12
 * @LastEditTime: 2025-02-13 14:41:57
 * @License: BSD (3-Clause)
 * @Copyright (c): <richenlin(at)gmail.com>
 */
import {
  OpenAPIObject, OperationObject, ParameterObject, PathItemObject, RequestBodyObject,
  SecurityRequirementObject
} from 'openapi3-ts/oas31';
import { API_CONTROLLER_KEY } from '../decorators/controller';
import { API_CLASS_HEADERS_KEY, API_METHOD_HEADERS_KEY } from '../decorators/header';
import { API_OPERATION_KEY } from '../decorators/operation';
import { API_PARAMETERS_KEY } from '../decorators/param';
import { API_RESPONSES_KEY } from '../decorators/response';
import { getBasedType, getFullPath } from '../util/utils';

export class PathsProcessor {
  static process(controllers: any[]): OpenAPIObject['paths'] {
    const paths: Record<string, PathItemObject> = {};

    controllers.forEach(controller => {
      const controllerMeta = Reflect.getMetadata(API_CONTROLLER_KEY, controller) || { path: '', options: {} };
      const classHeaders = Reflect.getMetadata(API_CLASS_HEADERS_KEY, controller.prototype) || [];
      const classTags = controllerMeta.options.tags || [];

      Object.getOwnPropertyNames(controller.prototype).forEach(methodName => {
        // const method = controller.prototype[methodName];
        const operation = Reflect.getMetadata(API_OPERATION_KEY, controller.prototype, methodName) || {};
        if (!operation.method) return;

        // 合并路径
        const methodPath = getFullPath(controllerMeta.path, operation.path);
        const pathItem = paths[methodPath] || {};

        // 处理安全方案和普通header分离
        const methodHeaders = Reflect.getMetadata(API_METHOD_HEADERS_KEY, controller.prototype, methodName) || [];
        const allHeaders = [...classHeaders, ...methodHeaders];

        // 分离普通header和安全方案
        const [securityHeaders, normalHeaders] = this.splitSecurityHeaders(allHeaders);

        // 构建操作对象
        const operationObject: OperationObject = {
          ...operation,
          operationId: operation.operationId || `${controller.name}_${methodName}`,
          tags: this.processTags(operation.tags || [], classTags),
          parameters: [
            ...this.processParameters(controller.prototype, methodName),
            ...this.convertHeaders(normalHeaders)
          ],
          security: this.processSecurity(securityHeaders),
          requestBody: this.processRequestBody(controller.prototype, methodName),
          responses: Reflect.getMetadata(API_RESPONSES_KEY, controller.prototype, methodName) || {},
        };

        pathItem[operation.method] = operationObject;
        paths[methodPath] = pathItem;
      });
    });

    return paths;
  }

  private static splitSecurityHeaders(headers: any[]): [any[], any[]] {
    const securityHeaders: any[] = [];
    const normalHeaders: any[] = [];

    headers.forEach(header => {
      header.securityScheme ? securityHeaders.push(header) : normalHeaders.push(header);
    });

    return [securityHeaders, normalHeaders];
  }

  private static processSecurity(headers: any[]): SecurityRequirementObject[] {
    const securityMap = new Map<string, string[]>();

    headers.forEach(header => {
      if (header.securityScheme) {
        const scheme = header.securityScheme;
        const scopes = scheme.type === 'oauth2' ? scheme.flows?.scopes || [] : [];
        securityMap.set(scheme.name, scopes);
      }
    });

    return Array.from(securityMap).map(([name, scopes]) => ({ [name]: scopes }));
  }

  private static processTags(methodTags: string[], classTags: string[]): string[] {
    return Array.from(new Set([...classTags, ...methodTags]));
  }

  private static processParameters(target: any, method: string): ParameterObject[] {
    const params = (Reflect.getMetadata(API_PARAMETERS_KEY, target, method) || [])
      ?.filter((p: any) => p.in !== 'body');
    return params.map((param: any) => ({
      name: param.name,
      in: param.in,
      description: param.description,
      required: param.required,
      schema: this.resolveParamSchema(param),
      // 其他参数属性...
    }));
  }

  private static resolveParamSchema(param: any): any {
    // 优先使用自定义schema
    if (param.schema) return param.schema;
    // 处理类型引用
    if (param.type) {
      // 注册DTO模型
      if (typeof param.type === 'function') {
        return { $ref: `#/components/schemas/${param.type}` };
      }
      // 处理数组类型
      if (Array.isArray(param.type)) {
        return {
          type: 'array',
          items: this.resolveParamSchema({ type: param.type[0] })
        };
      }
      // 基本类型映射
      return getBasedType(param.type);
    }
    // 默认字符串类型
    return { type: 'string' };
  }

  private static processRequestBody(target: any, method: string): RequestBodyObject {
    const bodyParams = (Reflect.getMetadata(API_PARAMETERS_KEY, target, method) || [])
      ?.filter((p: any) => p.in === 'body');
    if (!bodyParams?.length) return {} as RequestBodyObject;

    const contentType = bodyParams[0]?.contentType || 'application/json';
    return {
      content: {
        [contentType]: {
          schema: this.resolveBodySchema(bodyParams)
        }
      }
    };
  }

  private static resolveBodySchema(params: any[]) {
    if (params.length === 1) {
      return params[0].schema || params[0]["$ref"] || { $ref: `#/components/schemas/${params[0].type.name}` };
    }
    return {
      type: 'object',
      properties: params.reduce((acc, param) => {
        acc[param.name] = param.schema || param["$ref"] || { $ref: `#/components/schemas/${param.type.name}` };
        return acc;
      }, {})
    };
  }

  private static convertHeaders(headers: any[]): ParameterObject[] {
    return headers.map(header => ({
      name: header.name,
      in: 'header',
      description: header.description,
      required: header.required,
      schema: {
        type: 'string',
        ...header.securityScheme
      }
    }));
  }

  // private static mapType(type: any): string {
  //   const typeMap: Record<string, string> = {
  //     String: 'string',
  //     Number: 'number',
  //     Boolean: 'boolean',
  //     Date: 'string',
  //     Object: 'object',
  //     Array: 'array'
  //   };
  //   return typeMap[type.name] || 'string';
  // }
}

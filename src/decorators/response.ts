/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2025-02-10 15:45:51
 * @LastEditTime: 2025-02-11 16:16:36
 * @License: BSD (3-Clause)
 * @Copyright (c): <richenlin(at)gmail.com>
 */
import { SchemaObject } from 'openapi3-ts/oas31';
import 'reflect-metadata';


interface ResponseOptions<T> {
  type?: new () => T;
  isArray?: boolean;
  contentType?: string;
  schema?: SchemaObject;
}


// 元数据存储键
export const API_RESPONSES_KEY = 'swagger:responses';

/**
 * @description: ApiResponse装饰器
 * @return {*}
 */
export const ApiResponse = <T = any>(
  statusCode: number,
  description: string,
  options?: ResponseOptions<T>
): MethodDecorator => {
  return (target: any, propertyKey: string) => {
    const responses = Reflect.getMetadata(API_RESPONSES_KEY, target, propertyKey) || {};

    responses[statusCode] = {
      description,
      content: options?.contentType ? {
        [options.contentType]: {
          schema: resolveSchema(options)
        }
      } : undefined
    };

    Reflect.defineMetadata(API_RESPONSES_KEY, responses, target, propertyKey);
  };
}

/**
 * @description: 解析schema
 * @param {ResponseOptions} options
 * @return {*}
 */
function resolveSchema<T>(options: ResponseOptions<T>) {
  if (options.schema) return options.schema;
  if (options.type) {
    return options.isArray
      ? { type: 'array', items: { $ref: `#/components/schemas/${options.type.name}` } }
      : { $ref: `#/components/schemas/${options.type.name}` };
  }
  return { type: 'object' };
}

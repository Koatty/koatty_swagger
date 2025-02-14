/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2025-02-10 15:45:51
 * @LastEditTime: 2025-02-14 11:20:18
 * @License: BSD (3-Clause)
 * @Copyright (c): <richenlin(at)gmail.com>
 */
import { SchemaObject } from 'openapi3-ts/oas31';
import 'reflect-metadata';
import { API_RESPONSES_KEY } from '../util/key-type';
import { resolveSchema, SchemaDefinition } from '../util/response';


interface ResponseOptions {
  contentType?: string;
  isArray?: boolean;
  schema?: SchemaDefinition | SchemaObject;
}


/**
 * @description: ApiResponse装饰器
 * @return {*}
 */
export const ApiResponse = (
  statusCode: number,
  description: string,
  options?: ResponseOptions
): MethodDecorator => {
  return (target: any, propertyKey: string) => {
    const responses = Reflect.getMetadata(API_RESPONSES_KEY, target, propertyKey) || {};
    options?.contentType ? options.contentType : 'application/json';
    responses[statusCode] = {
      description,
      content: {
        [options.contentType]: {
          schema: resolveSchema(options.schema, options.isArray)
        }
      }
    };

    Reflect.defineMetadata(API_RESPONSES_KEY, responses, target, propertyKey);
  };
}

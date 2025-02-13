/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2025-02-10 15:38:37
 * @LastEditTime: 2025-02-13 10:24:12
 * @License: BSD (3-Clause)
 * @Copyright (c): <richenlin(at)gmail.com>
 */
import { ParameterObject } from 'openapi3-ts/oas31';
import 'reflect-metadata';
import { getParameterNames, getTypeSchema } from '../swagger/utils';

interface ApiParamConfig {
  /** 参数名称 */
  name: string;
  /** 参数位置 */
  in: 'query' | 'header' | 'path' | 'cookie' | 'body';
  /** 参数描述 */
  description?: string;
  /** 是否必填 */
  required?: boolean;
  /** 参数类型（用于生成schema） */
  type?: any;
  /** 自定义schema（优先级高于type） */
  schema?: Record<string, any>;
}

// 元数据存储键
export const API_PARAMETERS_KEY = 'swagger:parameters';

/**
 * @description: 参数装饰器
 * @param {ApiParamConfig[]} params
 * @return {*}
 */
export const ApiParam = (paramsConfig: Partial<ApiParamConfig>[] = []): MethodDecorator => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const paramTypes = Reflect.getMetadata('design:paramtypes', target, propertyKey);
    const parameterNames = getParameterNames(target[propertyKey]);

    const parameters: ParameterObject[] = paramTypes.map((type: any, index: number) => {
      const config = paramsConfig[index] || {};
      const p: any = {
        name: config.name || parameterNames[index] || `param${index}`,
        in: config.in || 'query',
        // required: config.required ?? true,
        ...getTypeSchema(type),
        // description: config.description,
      };
      config.required ? p.required = config.required : '';
      config.description ? p.description = config.description : '';
      return p;
    });


    Reflect.defineMetadata(API_PARAMETERS_KEY, parameters, target, propertyKey);
  };
};

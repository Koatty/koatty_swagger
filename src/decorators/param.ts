/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2025-02-10 15:38:37
 * @LastEditTime: 2025-02-14 10:18:24
 * @License: BSD (3-Clause)
 * @Copyright (c): <richenlin(at)gmail.com>
 */
import { ParameterObject } from 'openapi3-ts/oas31';
import 'reflect-metadata';
import { API_PARAMETERS_KEY } from '../util/key-type';
import { getParameterNames, getTypeSchema } from '../util/utils';

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
  /** 参数格式 */
  contentType?: string;
}

/**
 * @description: 参数装饰器
 * @param {ApiParamConfig[]} params
 * @return {*}
 */
export const ApiParam = (paramsConfig: ApiParamConfig | ApiParamConfig[]): MethodDecorator => {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const paramTypes = Reflect.getMetadata(API_PARAMETERS_KEY, target, propertyKey) || [];
    const parameterNames = getParameterNames(target[propertyKey]) || [];
    if (!Array.isArray(paramsConfig)) {
      paramsConfig = [paramsConfig];
    }
    if (paramTypes.length !== paramsConfig.length) {
      for (let index = 0; index < paramsConfig.length; index++) {
        const element = paramsConfig[index];
        if (parameterNames[index] === element.name) {
          continue;
        }
        paramTypes.push(element.type || String);
        paramsConfig[index].required = true;
      }
    }
    const parameters: ParameterObject[] = paramTypes.map((type: any, index: number) => {
      const config = (<Array<ApiParamConfig>>paramsConfig)[index] || {} as ApiParamConfig;
      const p: any = {
        ...config,
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

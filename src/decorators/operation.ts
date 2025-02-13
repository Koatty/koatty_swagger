/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2025-02-10 15:40:43
 * @LastEditTime: 2025-02-12 18:21:16
 * @License: BSD (3-Clause)
 * @Copyright (c): <richenlin(at)gmail.com>
 */
import 'reflect-metadata';

// 元数据存储键
export const API_OPERATION_KEY = 'swagger:operation';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

interface OperationConfig {
  method: HttpMethod,
  path: string,
  summary?: string;
  description?: string;
  deprecated?: boolean;
  tags?: string[];
}

/**
 * @description: Http method decorator
 * @param {OperationConfig} opt
 * @return {*}
 */
export const ApiOperation = (opt: OperationConfig): MethodDecorator => {
  return (target: any, propertyKey: string) => {
    const existing = Reflect.getMetadata(API_OPERATION_KEY, target, propertyKey);
    const operation = existing ? { ...existing } : {};

    Object.assign(operation, {
      ...opt,
      method: opt.method.toLowerCase(),
      path: opt.path.startsWith('/') ? opt.path : `/${opt.path}`,
      timestamp: Date.now() // 用于解决装饰器执行顺序问题
    });

    Reflect.defineMetadata(API_OPERATION_KEY, operation, target, propertyKey);
  };
}

/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2025-02-10 15:39:57
 * @LastEditTime: 2025-02-13 17:23:55
 * @License: BSD (3-Clause)
 * @Copyright (c): <richenlin(at)gmail.com>
 */
import 'reflect-metadata';
import { API_PROPERTY_KEY } from '../util/key-type';

interface PropertyOptions {
  type?: any;
  required?: boolean;
  isArray?: boolean;
  format?: string;
  description?: string;
  example?: any;
  enum?: any[];
}

/**
 * @description: Property装饰器
 * @param {PropertyOptions} options
 * @return {*}
 */
export const ApiProperty = (options: PropertyOptions = {}): PropertyDecorator => {
  return (target: any, propertyKey: string) => {
    // 关键修复：使用原型链末端实例存储元数据
    const metadataTarget = target.constructor.prototype;

    // 获取已存在的元数据（仅当前类）
    const existingMetadata = Reflect.getOwnMetadata(API_PROPERTY_KEY, metadataTarget) || {};
    const designType = Reflect.getMetadata('design:type', target, propertyKey);
    // 合并属性配置

    const schema = {
      type: options.type || designType,
      required: options.required ?? false,
      isArray: options.isArray || false,
      ...options
    };
    schema.enum ? schema.required = true : '';
    existingMetadata[propertyKey] = schema;

    // 将元数据直接附加到当前类的原型
    Reflect.defineMetadata(
      API_PROPERTY_KEY,
      existingMetadata,
      metadataTarget
    );
  };
}
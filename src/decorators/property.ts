/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2025-02-10 15:39:57
 * @LastEditTime: 2025-02-12 17:01:29
 * @License: BSD (3-Clause)
 * @Copyright (c): <richenlin(at)gmail.com>
 */
import 'reflect-metadata';
import { getModelTypeSchema } from '../swagger/utils';

interface PropertyOptions {
  type?: string | Function;
  format?: string;
  example?: any;
  description?: string;
  required?: boolean;
  isArray?: boolean;
  enum?: any[];
  default?: any;
}

// 元数据存储键
export const API_PROPERTIES_KEY = 'swagger:properties';

/**
 * @description: Property装饰器
 * @param {PropertyOptions} options
 * @return {*}
 */
export const ApiProperty = (options: PropertyOptions = {}): PropertyDecorator => {
  return (target: any, propertyKey: string) => {
    const properties = Reflect.getMetadata(API_PROPERTIES_KEY, target) || [];
    const designType = Reflect.getMetadata('design:type', target, propertyKey);
    const itemType = Reflect.getMetadata('design:itemtype', target, propertyKey);

    const schema = getModelTypeSchema({
      targetType: options.type || designType,
      itemType,       // 新增数组元素类型
      target,         // 传递类原型
      propertyKey,     // 传递属性名
      options
    });
    options.enum ? options.required = true : '';
    const propConfig = [...properties, {
      ...options,
      name: propertyKey,
      type: options.type || designType,
      ...schema
    }];


    Reflect.defineMetadata(
      API_PROPERTIES_KEY,
      propConfig,
      target
    );
  };
}
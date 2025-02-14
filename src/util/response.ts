/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2025-02-14 10:41:15
 * @LastEditTime: 2025-02-14 11:34:39
 * @License: BSD (3-Clause)
 * @Copyright (c): <richenlin(at)gmail.com>
 */
import { SchemaObject } from 'openapi3-ts/oas31';
import 'reflect-metadata';
import { getBasedType, isBasedType } from './utils';

export type SchemaDefinition = Record<string, ResponseProperty>;

export interface ResponseProperty {
  type: any;
  description?: string;
  required?: boolean;
  isArray?: boolean;
}

/**
 * @description: 
 * @param {any} cls
 * @return {*}
 */
function getRefForClass(cls: any): string {
  return `#/components/schemas/${cls.name}`;
}

/**
 * @description: 
 * @param {SchemaDefinition} definition
 * @return {*}
 */
function resolveObjectSchema(definition: SchemaDefinition): SchemaObject {
  const schema: SchemaObject = {
    type: 'object',
    properties: {},
    required: []
  };

  for (const [key, prop] of Object.entries(definition)) {
    const propSchema = resolvePropertySchema(prop);
    schema.properties![key] = propSchema;

    if (prop.required) {
      schema.required!.push(key);
    }
  }

  return schema;
}

/**
 * @description: 
 * @param {ResponseProperty} prop
 * @return {*}
 */
function resolvePropertySchema(prop: ResponseProperty): SchemaObject {
  let schema: SchemaObject = {};

  // 处理 DTO 类引用
  if (typeof prop.type === 'function' && !isBasedType(prop.type)) {
    const ref = getRefForClass(prop.type);
    schema = prop.isArray
      ? { type: 'array', items: { $ref: ref } }
      : { $ref: ref } as SchemaObject;
  }
  // 处理基本类型 
  else if (typeof prop.type === 'function') {
    schema = getBasedType(prop.type);
    if (prop.isArray) {
      schema = { type: 'array', items: schema };
    }
  }
  // 处理嵌套对象定义
  else if (typeof prop.type === 'object' && prop.type !== null) {
    schema = resolveObjectSchema(prop.type as SchemaDefinition);
    if (prop.isArray) {
      schema = { type: 'array', items: schema };
    }
  }

  // 添加描述
  if (prop.description) {
    schema.description = prop.description;
  }

  return schema;
}

/**
 * @description: 
 * @return {*}
 */
export function resolveSchema(
  schemaDef?: SchemaDefinition | SchemaObject | any,
  isArray = false
): SchemaObject | undefined {
  if (!schemaDef) return {};

  // 处理现成的 SchemaObject
  if ('type' in schemaDef || '$ref' in schemaDef) {
    if (isArray && !('array' in schemaDef || 'items' in schemaDef)) {
      return { type: 'array', items: schemaDef };
    }
    return schemaDef;
  }

  // 处理类引用
  if (typeof schemaDef === 'function' && !isBasedType(schemaDef)) {
    const refSchema = { $ref: getRefForClass(schemaDef) };
    return isArray ? { type: 'array', items: refSchema } : refSchema;
  }

  // 处理对象定义
  if (typeof schemaDef === 'object') {
    const schema = resolveObjectSchema(schemaDef as SchemaDefinition);
    return isArray ? { type: 'array', items: schema } : schema;
  }

  // 处理基本类型
  const schema = getBasedType(schemaDef);
  return isArray ? { type: 'array', items: schema } : schema;
}

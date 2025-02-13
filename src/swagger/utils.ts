/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2025-02-11 11:07:11
 * @LastEditTime: 2025-02-12 19:13:25
 * @License: BSD (3-Clause)
 * @Copyright (c): <richenlin(at)gmail.com>
 */

import { OAuthFlowObject, SchemaObject } from "openapi3-ts/oas31";

/**
 * @description: 
 * @param {array} sources
 * @return {*}
 */
export function mergeMetadata(...sources: any[]) {
  return sources.reduce((acc, curr) => {
    if (Array.isArray(curr)) {
      return [...new Set([...acc, ...curr])];
    }
    if (typeof curr === 'object') {
      return { ...acc, ...curr };
    }
    return curr || acc;
  });
}

/**
 * @description: 
 * @param {string} controllerPath
 * @param {string} methodPath
 * @return {*}
 */
export function getFullPath(controllerPath: string, methodPath: string): string {
  if (!controllerPath && !methodPath) return '/';
  controllerPath = controllerPath.replace(/\/$/, '');
  methodPath = methodPath.replace(/\/$/, '');
  if (!methodPath) return controllerPath;
  if (!controllerPath) return methodPath;

  return `${controllerPath === '/' ? '' : controllerPath}/${removeLeadingSlashes(methodPath)}`;
}

/**
 * @description: 
 * @param {string} parent
 * @param {string} current
 * @return {*}
 */
function removeLeadingSlashes(str: string): string {
  return str.replace(/^\/+/, '');
}

/**
 * @description: 
 * @param {array} headers
 * @return {*}
 */
export function combineSecuritySchemes(headers: any[]): Record<string, any> {
  return headers.reduce((acc, header) => {
    if (header.securityScheme) {
      acc[header.securityScheme.name] = header.securityScheme;
    }
    return acc;
  }, {});
}

/**
 * @description: 获取参数名称的工具函数（需要TS编译设置 --emitDecoratorMetadata）
 * @param {Function} func
 * @return {*}
 */
export function getParameterNames(func: Function): string[] {
  const paramNames = func.toString()
    .replace(/\/\*.*?\*\//g, '') // 移除注释
    .replace(/\/\/.*$/gm, '')    // 移除行注释
    .match(/\((.*?)\)/)?.[1]     // 提取参数部分
    .split(',')                  // 分割参数
    .map(p => p.trim().split('=')[0]) // 处理默认值
    .filter(Boolean) || [];

  return paramNames;
}

const advancedTypeMapping = new Map<Function, SchemaObject>([
  [String, { type: 'string' }],
  [Number, { type: 'number' }],
  [BigInt, { type: 'number' }],
  [Boolean, { type: 'boolean' }],
  [Date, { type: 'string', format: 'date-time' }],
  [Array, { type: 'array' }],
  [Object, { type: 'object' }],
  [Buffer, { type: 'string', format: 'binary' }]
]);

/**
 * @description: 获取类型的schema
 * @param {any} targetType
 * @return {*}
 */
export function getTypeSchema(targetType: any): SchemaObject {
  // 处理数组类型（支持泛型）
  if (targetType === Array || targetType.name === 'Array') {
    return { type: 'array', items: { type: 'string' } };
  }

  // 处理嵌套泛型（需要自定义元数据）
  if (targetType?.prototype?.constructor?.name === 'Array') {
    const itemType = Reflect.getMetadata('design:itemtype', targetType.prototype);
    return { type: 'array', items: getTypeSchema(itemType) };
  }

  // 处理自定义类/DTO
  if (targetType?.prototype && !advancedTypeMapping.has(targetType)) {
    return { $ref: `#/components/schemas/${targetType.name}` } as SchemaObject;
  }

  // 处理原生类型
  return advancedTypeMapping.get(targetType) || { type: 'string' };
}

interface TypeSchemaContext {
  targetType: any;
  itemType?: any;
  target?: any;
  options?: any;
  propertyKey?: string;
}

/**
 * @description: 获取类型的schema
 * @param {TypeSchemaContext} context
 * @return {*}
 */
export function getModelTypeSchema(context: TypeSchemaContext): SchemaObject {
  const { targetType, itemType, target, propertyKey, options } = context;

  // 处理数组类型
  if (targetType === Array || targetType?.name === 'Array' || options?.isArray) {
    let actualItemType = options.type || itemType;
    if (!actualItemType && target && propertyKey) {
      actualItemType = Reflect.getMetadata('design:itemtype', target, propertyKey);
    }
    if (!actualItemType) {
      actualItemType = String;
    }

    return {
      type: 'array',
      items: getModelTypeSchema({
        targetType: actualItemType,
        target,
        propertyKey
      })
    };
  }

  // 处理DTO引用
  if (typeof targetType === 'function' && !advancedTypeMapping.has(targetType)) {
    return { type: "object", $ref: `#/components/schemas/${targetType.name}` } as SchemaObject;
  }

  // 处理原生类型
  return advancedTypeMapping.get(targetType) || { type: 'string' };
}

/**
 * @description: 获取OAuth流程配置
 * @param {any} flowConfig
 * @param {string} flowType
 * @return {*}
 */
export function getMapOAuthFlow(flowConfig: any, flowType: string): OAuthFlowObject {
  // 根据流程类型验证必要字段
  switch (flowType) {
    case 'implicit':
      if (!flowConfig.authorizationUrl) {
        throw new Error('Implicit flow requires authorizationUrl');
      }
      break;

    case 'password':
    case 'clientCredentials':
      if (!flowConfig.tokenUrl) {
        throw new Error(`${flowType} flow requires tokenUrl`);
      }
      break;

    case 'authorizationCode':
      if (!flowConfig.authorizationUrl || !flowConfig.tokenUrl) {
        throw new Error('Authorization code flow requires both authorizationUrl and tokenUrl');
      }
      break;
  }

  // HTTPS 协议强制校验
  // const validateHttps = (url: string) => {
  //   if (!url.startsWith('https://')) {
  //     throw new Error(`OAuth URL must use HTTPS: ${url}`);
  //   }
  // };

  // if (flowConfig.authorizationUrl) validateHttps(flowConfig.authorizationUrl);
  // if (flowConfig.tokenUrl) validateHttps(flowConfig.tokenUrl);
  // if (flowConfig.refreshUrl) validateHttps(flowConfig.refreshUrl);

  return {
    authorizationUrl: flowConfig.authorizationUrl,
    tokenUrl: flowConfig.tokenUrl,
    refreshUrl: flowConfig.refreshUrl,
    scopes: flowConfig.scopes || {}
  };
}

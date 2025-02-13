/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2025-02-11 11:07:11
 * @LastEditTime: 2025-02-13 17:50:21
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


const basedTypeMap = new Map<string, SchemaObject>([
  ['string', { type: 'string' }],
  ['number', { type: 'number' }],
  ['boolean', { type: 'boolean' }],
  ['date', { type: 'string', format: 'date-time' }],
  ['object', { type: 'object' }],
  ['array', { type: 'array' }],
  ['bigint', { type: 'number' }],
  ['buffer', { type: 'string', format: 'binary' }],

  ['String', { type: 'string' }],
  ['Number', { type: 'number' }],
  ['Boolean', { type: 'boolean' }],
  ['Date', { type: 'string', format: 'date-time' }],
  ['Object', { type: 'object' }],
  ['Array', { type: 'array' }],
  ['Bigint', { type: 'number' }],
  ['Buffer', { type: 'string', format: 'binary' }]
]);

/**
 * @description: 获取增强型类型
 * @param {any} input
 * @return {*}
 */
export const getBasedType = (input: any): SchemaObject => {
  let typeKey: string;

  // 检查输入是否为构造函数
  if (typeof input === 'function') {
    typeKey = input.name;
  } else if (typeof input === 'string') {
    // 如果输入是字符串，直接转换为小写
    typeKey = input;
  } else {
    // 处理其他类型（例如，数字等）
    typeKey = typeof input;
  }
  return basedTypeMap.get(typeKey) || { type: 'string' }; // 默认返回 { type: 'string' }
};

/**
 * @description: 检查类型是否在增强类型映射中
 * @param {any} targetType
 * @return {*}
 */
export const hasBasedType = (targetType: any): boolean => {
  return basedTypeMap.has(targetType.name) || basedTypeMap.has(targetType);
}

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
  if (targetType?.prototype && !hasBasedType(targetType)) {
    return { $ref: `#/components/schemas/${targetType.name}` } as SchemaObject;
  }

  // 处理原生类型
  return getBasedType(targetType) || { type: 'string' };
}

interface TypeSchemaContext {
  targetType: any;
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
  const { targetType, target, propertyKey, options } = context;

  // 处理数组类型
  if (targetType === Array || targetType?.name === 'Array' || options?.isArray) {
    let actualItemType = options.type;
    if (!actualItemType && target && propertyKey) {
      actualItemType = Reflect.getMetadata('design:itemtype', target, propertyKey);
    }
    if (!actualItemType) {
      actualItemType = String;
    }
    const opt = { ...options, isArray: false };
    return {
      type: 'array',
      items: getModelTypeSchema({
        targetType: actualItemType,
        target,
        options: opt,
        propertyKey
      })
    };
  }

  // 处理DTO引用
  if (typeof targetType === 'function' && !hasBasedType(targetType)) {
    return { type: "object", $ref: `#/components/schemas/${targetType.name}` } as SchemaObject;
  }

  // 处理原生类型
  return getBasedType(targetType) || { type: 'string' };
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

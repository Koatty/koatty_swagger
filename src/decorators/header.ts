/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2025-02-10 14:29:02
 * @LastEditTime: 2025-02-12 19:22:35
 * @License: BSD (3-Clause)
 * @Copyright (c): <richenlin(at)gmail.com>
 */
import {
  OAuthFlowObject
} from 'openapi3-ts/oas31';
import 'reflect-metadata';
import { API_CLASS_HEADERS_KEY, API_METHOD_HEADERS_KEY } from '../util/key-type';

// 增强型类型定义（处理装饰器配置）
export type OAuthFlowConfig = Omit<OAuthFlowObject, 'scopes'> & {
  scopes?: Record<string, string>;
};

export type OAuthFlowsConfig = {
  implicit?: OAuthFlowConfig;
  password?: OAuthFlowConfig;
  clientCredentials?: OAuthFlowConfig;
  authorizationCode?: OAuthFlowConfig;
};

interface HeaderConfig {
  name: string;
  description?: string;
  required?: boolean;
  securityScheme?: SecurityScheme;
}

export interface SecurityScheme {
  name: string;
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  scheme?: string;
  bearerFormat?: string;
  flows?: OAuthFlowsConfig;
}

/**
 * @description: Header装饰器
 * @param {HeaderConfig} config
 * @return {*}
 */
export const ApiHeader = (config: HeaderConfig): ClassDecorator & MethodDecorator => {
  return (target: any, propertyKey?: string) => {
    const metadataKey = propertyKey
      ? API_METHOD_HEADERS_KEY
      : API_CLASS_HEADERS_KEY;

    const store = propertyKey
      ? target
      : target.prototype;

    const existing = Reflect.getMetadata(metadataKey, store, propertyKey!) || [];
    const headers = [...existing, config];

    Reflect.defineMetadata(metadataKey, headers, store, propertyKey);
  };
}


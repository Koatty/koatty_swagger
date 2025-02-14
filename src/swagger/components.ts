/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2025-02-10 14:41:29
 * @LastEditTime: 2025-02-14 10:51:02
 * @License: BSD (3-Clause)
 * @Copyright (c): <richenlin(at)gmail.com>
 */
import {
  ComponentsObject,
  OAuthFlowsObject,
  SchemaObject,
  SecuritySchemeObject
} from 'openapi3-ts/oas31';

import { API_CLASS_HEADERS_KEY, API_METHOD_HEADERS_KEY, API_MODEL_KEY, API_PROPERTY_KEY } from '../util/key-type';
import { modelRegistry } from '../util/model-registry';
import { getMapOAuthFlow } from '../util/utils';

export class ComponentGenerator {
  private static visitedDTOs = new Set<Function>();
  private static schemas: Record<string, SchemaObject> = {};
  private static securitySchemes: Record<string, SecuritySchemeObject> = {};

  static generate(controllers: any[]): ComponentsObject {
    this.resetState();
    modelRegistry.listModels().forEach(model => this.processModel(model));
    controllers.forEach(controller => this.processController(controller));
    return this.buildComponents();
  }

  private static resetState() {
    this.visitedDTOs.clear();
    this.schemas = {};
    this.securitySchemes = {};
  }

  private static processController(controller: any) {
    this.processClassSecuritySchemes(controller);
    this.processMethodSecuritySchemes(controller);
  }

  private static processModel(modelEntries: {
    target: Function,
    schema: SchemaObject
  }) {
    const schema = modelEntries.schema;
    const modelName = modelRegistry.getModelName(modelEntries.target);
    this.schemas[modelName] = schema;
  }

  private static generateModelSchema(model: Function): SchemaObject {
    const properties = Reflect.getMetadata(API_PROPERTY_KEY, model.prototype) || [];
    const required = [];
    const schema: SchemaObject = {
      type: 'object',
      properties: {}
    };

    // 处理属性
    for (const prop of properties) {
      schema.properties[prop.name] = prop;
      if (prop.required) {
        required.push(prop.name);
      }
    }

    // 处理继承
    const parentModel = Object.getPrototypeOf(model.prototype).constructor;
    if (parentModel !== Object &&
      Reflect.hasMetadata(API_MODEL_KEY, parentModel)) {
      schema.allOf = [
        { $ref: `#/components/schemas/${modelRegistry.getModelName(parentModel)}` }
      ];
    }

    if (required.length > 0) {
      schema.required = required;
    }

    return schema;
  }

  private static processClassSecuritySchemes(controller: any) {
    const classHeaders = Reflect.getMetadata(API_CLASS_HEADERS_KEY, controller.prototype) || [];
    this.extractSecuritySchemes(classHeaders);
  }

  private static processMethodSecuritySchemes(controller: any) {
    Object.getOwnPropertyNames(controller.prototype).forEach(methodName => {
      const methodHeaders = Reflect.getMetadata(API_METHOD_HEADERS_KEY, controller.prototype, methodName) || [];
      this.extractSecuritySchemes(methodHeaders);
    });
  }

  private static extractSecuritySchemes(headers: any[]) {
    headers.forEach(header => {
      if (header.securityScheme) {
        const { name, ...schemeConfig } = header.securityScheme;
        this.securitySchemes[name] = this.mapSecurityScheme(schemeConfig);
      }
    });
  }

  private static mapSecurityScheme(config: any): SecuritySchemeObject {
    const { type, flows, ...rest } = config;
    const baseScheme: SecuritySchemeObject = {
      type: type as any,
      ...rest
    };

    if (type === 'oauth2' && flows) {
      baseScheme.flows = this.processOAuthFlows(flows);
    }

    return baseScheme;
  }

  private static processOAuthFlows(flowsConfig: any): OAuthFlowsObject {
    const flows: OAuthFlowsObject = {};

    // 显式处理每种流程类型
    if (flowsConfig.implicit) {
      flows.implicit = getMapOAuthFlow(flowsConfig.implicit, 'implicit');
    }
    if (flowsConfig.password) {
      flows.password = getMapOAuthFlow(flowsConfig.password, 'password');
    }
    if (flowsConfig.clientCredentials) {
      flows.clientCredentials = getMapOAuthFlow(flowsConfig.clientCredentials, 'clientCredentials');
    }
    if (flowsConfig.authorizationCode) {
      flows.authorizationCode = getMapOAuthFlow(flowsConfig.authorizationCode, 'authorizationCode');
    }

    return flows;
  }

  private static buildComponents(): ComponentsObject {
    return {
      schemas: this.schemas,
      securitySchemes: this.securitySchemes
    };
  }
}

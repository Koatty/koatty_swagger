import { OpenAPIV3 } from 'openapi-types';
import { API_MODEL_KEY } from '../decorators/model';
import { API_PROPERTY_KEY } from '../decorators/property';
import { getModelTypeSchema } from './utils';

type SchemaObject = OpenAPIV3.SchemaObject;
type SchemaType = 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'object';

export class ModelRegistry {
  private models = new Map<Function, SchemaObject>();
  private nameMapping = new Map<string, Function>();

  add(target: Function) {
    if (this.models.has(target)) return;

    // 先处理继承链确保父类已注册
    this.processInheritanceHierarchy(target);

    // 生成当前类schema
    const schema = this.buildSchemaWithInheritance(target);
    const modelName = this.getModelName(target);

    // 处理名称冲突
    if (this.nameMapping.has(modelName)) {
      const existing = this.nameMapping.get(modelName)!;
      // console.warn(`模型名称冲突: ${modelName} 已由 ${existing.name} 注册`);
    }

    this.models.set(target, schema);
    this.nameMapping.set(modelName, target);
  }

  has(target: Function) {
    return this.models.has(target);
  }

  get(target: Function): SchemaObject {
    if (!this.models.has(target)) {
      throw new Error(`Model ${target.name} not registered`);
    }
    return this.models.get(target)!;
  }

  getRef(target: Function): SchemaObject {
    if (!this.models.has(target)) {
      throw new Error(`模型未注册: ${target.name}`);
    }
    return { $ref: `#/components/schemas/${this.getModelName(target)}` } as SchemaObject;
  }

  listModels(): any[] {
    const result: any[] = [];
    // 遍历 Map
    this.models.forEach((schema, target) => {
      result.push({ target, schema });
    });
    return result;
  }

  clear() {
    this.models.clear();
    this.nameMapping.clear();
  }

  getModelName(target: Function): string {
    const meta = Reflect.getMetadata(API_MODEL_KEY, target);
    return meta?.name || target.name;
  }

  private processInheritanceHierarchy(target: Function) {
    const hierarchy: Function[] = [];
    let current = target;

    while (current && current !== Function.prototype) {
      hierarchy.unshift(current); // 父类在前
      current = Object.getPrototypeOf(current);
    }

    hierarchy.forEach(cls => {
      if (!this.models.has(cls)) {
        this.buildSchemaWithInheritance(cls);
      }
    });
  }

  private buildSchemaWithInheritance(target: Function): SchemaObject {
    const meta = Reflect.getMetadata(API_MODEL_KEY, target) || {};
    const ownProperties = this.collectOwnProperties(target);
    const parent = Object.getPrototypeOf(target);

    const schema: SchemaObject = {
      // type: 'object',
      description: meta.description
    };

    // 处理继承关系
    if (parent && parent !== Function.prototype && this.models.has(parent)) {
      schema.allOf = [
        { $ref: `#/components/schemas/${this.getModelName(parent)}` }
      ];

      // 添加当前类的属性到allOf
      if (Object.keys(ownProperties.properties || {}).length > 0) {
        schema.allOf.push({
          type: 'object',
          properties: ownProperties.properties,
          required: ownProperties.required
        });
      }
    } else {
      // 无继承的直接合并属性
      Object.assign(schema, ownProperties);
    }

    return schema;
  }

  private collectOwnProperties(target: Function): {
    properties?: Record<string, SchemaObject>;
    required?: string[];
  } {
    const properties: Record<string, SchemaObject> = {};
    const required: string[] = [];

    // 获取当前类自身的元数据
    const props = Reflect.getOwnMetadata(
      API_PROPERTY_KEY,
      target.prototype
    ) || {};


    for (const [propertyName, config] of Object.entries(props)) {
      const options = config || {};
      properties[propertyName] = this.createPropertySchema(target.prototype, propertyName, options);
      if ((<any>config).required) {
        required.push(propertyName);
      }
    }

    return {
      properties: Object.keys(properties).length > 0 ? properties : {},
      required: required.length > 0 ? required : []
    };
  }

  private createPropertySchema(target: any, propertyKey: string, options: any): any {
    // 优先使用自定义schema
    if (options.schema) {
      return { ...options.schema };
    }
    // 处理类型引用
    const type = options.type;
    const schema = getModelTypeSchema({ targetType: type, target, propertyKey, options });
    const opt: any = {};
    options.required ? opt.required = options.required : null;
    options.format ? opt.format = options.format : null;
    options.description ? opt.description = options.description : null;
    options.example ? opt.example = options.example : null;
    options.enum ? opt.enum = options.enum : null;
    return { ...opt, ...schema };
  }

}

// 单例实例
export const modelRegistry = new ModelRegistry();

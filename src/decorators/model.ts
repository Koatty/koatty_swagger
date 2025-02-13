/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2025-02-12 09:28:09
 * @LastEditTime: 2025-02-12 18:22:36
 * @License: BSD (3-Clause)
 * @Copyright (c): <richenlin(at)gmail.com>
 */
// 全局存储所有注册的模型
const modelRegistry = new Set<Function>();
// 元数据存储键
export const API_MODEL_KEY = 'swagger:model';

export function ApiModel(options: {
  name?: string;
  description?: string;
} = {}): ClassDecorator {
  return (target: Function) => {
    // 注册模型类
    modelRegistry.add(target);

    // 存储元数据
    Reflect.defineMetadata(API_MODEL_KEY, {
      name: options.name || target.name,
      description: options.description,
      inherit: true
    }, target);

    // 处理继承关系
    processInheritance(target);
  };
}

// 处理继承链上的模型
function processInheritance(target: Function) {
  const meta = Reflect.getMetadata(API_MODEL_KEY, target.prototype);
  if (meta?.inherit === false) return;

  let parent = Object.getPrototypeOf(target.prototype).constructor;

  while (parent !== Object) {
    if (Reflect.hasMetadata(API_MODEL_KEY, parent.prototype)) {
      // 检查父类是否允许继承
      const parentMeta = Reflect.getMetadata(API_MODEL_KEY, parent.prototype);
      if (parentMeta?.inherit === false) {
        break;
      };
    }
    parent = Object.getPrototypeOf(parent.prototype).constructor;
  }
}
/**
 * 注册模型
 * @param target 
 */
export function registerModel(target: Function) {
  modelRegistry.add(target);
}

/**
 * 获取所有注册模型
 * @returns 
 */
export function getRegisteredModels(): Function[] {
  return Array.from(modelRegistry);
}
/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2025-02-12 09:28:09
 * @LastEditTime: 2025-02-13 15:38:58
 * @License: BSD (3-Clause)
 * @Copyright (c): <richenlin(at)gmail.com>
 */

import { modelRegistry } from "../util/model-registry";

// 元数据存储键
export const API_MODEL_KEY = 'swagger:model';

export function ApiModel(options: {
  name?: string;
  description?: string;
} = {}): ClassDecorator {
  return (target: Function) => {
    // 存储元数据
    Reflect.defineMetadata(API_MODEL_KEY, {
      name: options.name || target.name,
      description: options.description,
      inherit: true
    }, target);
    // 注册模型类
    modelRegistry.add(target);
  };
}
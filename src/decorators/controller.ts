/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2025-02-10 15:41:04
 * @LastEditTime: 2025-02-12 18:57:11
 * @License: BSD (3-Clause)
 * @Copyright (c): <richenlin(at)gmail.com>
 */
import 'reflect-metadata';
import { API_CONTROLLER_KEY } from '../util/key-type';

// 全局存储所有注册的模型
const controllerRegistry = new Set<Function>();

interface ControllerOptions {
  name?: string;
  description?: string;
  tags?: string[];
}

/**
 * @description: Controller装饰器
 * @param {string} path
 * @return {*}
 */
export const ApiController = (path?: string, opt?: ControllerOptions): ClassDecorator => {
  return (target: any) => {
    const parentMeta = Reflect.getMetadata(API_CONTROLLER_KEY, target) || { path: "" };
    const fullPath = combinePaths(parentMeta.path, path);
    // 注册控制器类
    controllerRegistry.add(target);
    opt = opt || {
      name: target.name,
      description: "",
    };
    opt.tags = opt?.tags || [target.name];
    Reflect.defineMetadata(API_CONTROLLER_KEY, {
      path: fullPath,
      options: opt
    }, target);

    // 处理继承链
    const parentClass = Object.getPrototypeOf(target);
    if (parentClass && parentClass !== Function.prototype) {
      const parentMetas = Reflect.getMetadata(API_CONTROLLER_KEY, parentClass) || { path: "" };
      Reflect.defineMetadata(API_CONTROLLER_KEY,
        {
          path: combinePaths(parentMetas.path, fullPath),
          options: opt
        }, target);
    }
  };
}

/**
 * @description: 合并路径
 * @param {string} parent
 * @param {string} current
 * @return {*}
 */
function combinePaths(parent: string, current: string): string {
  if (!parent) return current;
  return `${parent.replace(/\/$/, '')}/${current.replace(/^\//, '')}`;
}

// 获取所有注册控制器
export function getRegisteredCtls(): Function[] {
  return Array.from(controllerRegistry);
}
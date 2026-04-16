/*
 * @Description: 
 * @Usage: 
 * @Author: richen
 * @Date: 2025-02-10 14:24:54
 * @LastEditTime: 2025-02-11 17:30:38
 * @License: BSD (3-Clause)
 * @Copyright (c): <richenlin(at)gmail.com>
 */
import { writeFile } from "fs/promises";
import Koa from "koa";
import compose from 'koa-compose';
import mount from 'koa-mount';
import { Koatty } from "koatty";
import { OpenAPIObject } from "openapi3-ts/oas30";
import { ComponentGenerator } from "./swagger/components";
import { PathsProcessor } from "./swagger/paths";

// 配置类型定义
export interface SwaggerConfig {
  title: string;
  version: string;
  description?: string;
  servers?: Array<{ url: string; description?: string }>;
  controllers: any[];
  jsonPath?: string;
  uiPath?: string;
  cdnBase?: string;
}

/**
 * default options
 */
const defaultOptions: SwaggerConfig = {
  title: 'API文档',
  version: '1.0.0',
  controllers: [],
  jsonPath: 'swagger.json',
  uiPath: '/swagger-ui',
  cdnBase: 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5',
  servers: [{ url: 'http://api.example.com' }]
};

/**
 * Swagger Middleware
 * 
 * @export
 * @param {OptionsInterface} options
 * @param {Application} app
 * @returns {*}  {Koa.Middleware}
 */
export function KoattySwagger(options: SwaggerConfig, app: Koatty): Koa.Middleware {
  const opt = { ...defaultOptions, ...options };
  // 生成完整文档（缓存结果）
  const doc = generateOpenAPIDoc(opt);

  // 异步写入文件系统
  if (opt.jsonPath && !opt.jsonPath.startsWith('/')) {
    writeFile(opt.jsonPath, JSON.stringify(doc, null, 2)).catch(err => {
      console.error('Failed to write OpenAPI doc:', err);
    });
  }
  return middleware(opt, doc);
}

/**
 * 生成OpenAPI文档
 * @param {SwaggerConfig} config
 * @returns {*}  {OpenAPIObject}
 * @export
 **/
export function generateOpenAPIDoc(config: SwaggerConfig): OpenAPIObject {
  const doc: OpenAPIObject = {
    openapi: '3.0.0',
    info: { ...config },
    servers: config.servers,
    paths: PathsProcessor.process(config.controllers),
    components: ComponentGenerator.generate(config.controllers),
  };

  return doc;
}

/**
 * Middleware
 * @param {SwaggerConfig} config
 * @param {OpenAPIObject} cachedDoc
 * @return {*}
 */
function middleware(config: SwaggerConfig, cachedDoc: OpenAPIObject): Koa.Middleware {
  const router = async (ctx: Koa.Context, next: Koa.Next) => {
    if (ctx.path === config.jsonPath) {
      ctx.body = cachedDoc;
      ctx.type = 'application/json';
      return;
    }

    if (config.uiPath && ctx.path.startsWith(config.uiPath)) {
      return next();
    }

    await next();
  };

  return compose([
    router,
    config.uiPath && mount(config.uiPath, serveSwaggerUI(config))
  ].filter(Boolean) as Koa.Middleware[]);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function escapeJsString(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/</g, '\\x3c')
    .replace(/>/g, '\\x3e')
    .replace(/\//g, '\\/');
}

/**
 * Serve Swagger UI
 * @param config 
 * @returns 
 */
function serveSwaggerUI(config: SwaggerConfig): Koa.Middleware {
  const specUrl = config.jsonPath!;
  const cdn = config.cdnBase || 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5';
  if (!/^https?:\/\//i.test(cdn)) {
    throw new Error('cdnBase must be a valid HTTP(S) URL');
  }
  const safeCdn = escapeHtml(cdn);
  const safeSpecUrl = escapeJsString(specUrl);
  const uiHTML = `
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="${safeCdn}/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${safeCdn}/swagger-ui-bundle.js"></script>
  <script>
    window.onload = () => {
      SwaggerUIBundle({
        url: '${safeSpecUrl}',
        dom_id: '#swagger-ui'
      });
    }
  </script>
</body>
</html>`;

  return async (ctx, next) => {
    ctx.type = 'text/html';
    ctx.body = uiHTML;
    await next();
  };
}

// // 使用示例
// const app = new Koa();
// app.use(SwaggerMiddleware.init({
//   title: 'API文档',
//   version: '1.0.0',
//   controllers: [UserController],
//   servers: [{ url: 'http://api.example.com' }]
// }));

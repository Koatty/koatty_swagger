# koatty_swagger

A better way to create Swagger/OpenAPI documentation for Koatty applications using TypeScript decorators.

## Installation

```bash
npm install koatty_swagger reflect-metadata
```

> **Note**: `reflect-metadata` is required as a peer dependency for decorator metadata support.

## Quick Start

### 1. Register the Middleware

```typescript
import { Koatty } from 'koatty';
import { KoattySwagger } from 'koatty_swagger';
import { UserController } from './controllers/UserController';

const app = new Koatty();

app.use(KoattySwagger({
  title: 'My API Documentation',
  version: '1.0.0',
  description: 'API documentation for my application',
  controllers: [UserController],
  jsonPath: '/swagger.json',
  uiPath: '/swagger-ui',
  servers: [
    { url: 'http://localhost:3000', description: 'Development server' },
    { url: 'https://api.example.com', description: 'Production server' }
  ]
}, app));

app.listen(3000);
```

### 2. Define Your Controller

```typescript
import { ApiController } from 'koatty_swagger';
import { ApiOperation } from 'koatty_swagger';

@ApiController('/users')
export class UserController {
  @ApiOperation({
    method: 'GET',
    path: '/',
    summary: 'Get all users',
    tags: ['User']
  })
  list() {
    // implementation
  }
}
```

## Decorator Reference

### Controller Decorators

| Decorator | Usage | Description |
|-----------|-------|-------------|
| `@ApiController(path?, options?)` | Class | Marks a class as an API controller and sets the base path |

**Options:**
```typescript
interface ControllerOptions {
  name?: string;        // Controller name (defaults to class name)
  description?: string; // Controller description
  tags?: string[];      // Tags for grouping endpoints
}
```

### Method Decorators

| Decorator | Usage | Description |
|-----------|-------|-------------|
| `@ApiOperation(config)` | Method | Defines an HTTP endpoint with method, path, and metadata |
| `@ApiResponse(status, description, options?)` | Method | Describes a response for a specific status code |
| `@ApiParam(config)` | Method | Describes path/query/header/body parameters |
| `@ApiHeader(config)` | Method | Describes a header parameter (also usable at class level) |

### Model Decorators

| Decorator | Usage | Description |
|-----------|-------|-------------|
| `@ApiModel(options?)` | Class | Marks a class as an API model/schema |
| `@ApiProperty(options?)` | Property | Describes a model property |

## Detailed Decorator Usage

### @ApiOperation

Defines an API endpoint with HTTP method and path.

```typescript
@ApiOperation({
  method: 'GET',           // Required: HTTP method
  path: '/users/{id}',     // Required: Endpoint path
  summary?: string,        // Optional: Short summary
  description?: string,    // Optional: Detailed description
  tags?: string[],         // Optional: Tags for grouping
  deprecated?: boolean     // Optional: Mark as deprecated
})
```

**Example:**
```typescript
@ApiOperation({
  method: 'GET',
  path: '/users/{id}',
  summary: 'Get user by ID',
  description: 'Returns a single user by their unique identifier',
  tags: ['User'],
  deprecated: false
})
getUser() {}
```

### @ApiParam

Describes request parameters (path, query, header, cookie, body).

```typescript
@ApiParam({
  name: string,            // Parameter name
  in: 'query' | 'path' | 'header' | 'cookie' | 'body',  // Parameter location
  description?: string,    // Parameter description
  required?: boolean,      // Whether required
  type?: any,              // Type constructor (String, Number, Boolean, etc.)
  schema?: object,         // Custom OpenAPI schema
  contentType?: string     // Content type (for body params)
})
```

**Examples:**
```typescript
// Single parameter
@ApiOperation({ method: 'GET', path: '/users/{id}' })
@ApiParam({
  name: 'id',
  in: 'path',
  description: 'User ID',
  type: Number,
  required: true
})
getUser() {}

// Multiple parameters
@ApiOperation({ method: 'GET', path: '/search' })
@ApiParam([
  { name: 'q', in: 'query', description: 'Search query', required: true },
  { name: 'limit', in: 'query', description: 'Max results', type: Number },
  { name: 'X-Request-ID', in: 'header', description: 'Request trace ID' }
])
search() {}

// Body parameter with schema
@ApiOperation({ method: 'POST', path: '/users' })
@ApiParam({
  name: 'payload',
  in: 'body',
  schema: {
    type: 'object',
    properties: {
      name: { type: 'string' },
      email: { type: 'string', format: 'email' }
    },
    required: ['name', 'email']
  }
})
createUser() {}
```

### @ApiResponse

Describes API responses.

```typescript
@ApiResponse(
  statusCode: number,      // HTTP status code
  description: string,     // Response description
  options?: {
    contentType?: string,  // Default: 'application/json'
    isArray?: boolean,     // Whether response is an array
    schema?: SchemaDefinition | SchemaObject  // Response schema
  }
)
```

**Examples:**
```typescript
// Simple response
@ApiResponse(200, 'Success')
@ApiResponse(404, 'User not found')

// Response with model reference
@ApiResponse(200, 'User details', {
  schema: UserDto
})

// Array response
@ApiResponse(200, 'List of users', {
  isArray: true,
  schema: UserDto
})

// Custom schema
@ApiResponse(200, 'Success', {
  schema: {
    type: 'object',
    properties: {
      data: { type: 'object' },
      message: { type: 'string' }
    }
  }
})
```

### @ApiModel

Defines a model/schema class.

```typescript
@ApiModel({
  name?: string,           // Schema name (defaults to class name)
  description?: string     // Schema description
})
```

**Example:**
```typescript
@ApiModel({ description: 'User information' })
export class UserDto {
  @ApiProperty({ type: 'string' })
  name!: string;

  @ApiProperty({ type: 'string', format: 'email' })
  email!: string;
}
```

### @ApiProperty

Describes a model property.

```typescript
@ApiProperty({
  type?: any,              // Type: 'string', 'number', 'boolean', class reference
  required?: boolean,      // Whether required (default: false)
  isArray?: boolean,       // Whether it's an array
  format?: string,         // OpenAPI format (e.g., 'email', 'uuid', 'date-time')
  description?: string,    // Property description
  example?: any,           // Example value
  enum?: any[]             // Enum values (sets required to true)
})
```

**Examples:**
```typescript
@ApiModel({ name: 'CreateUserDto' })
export class CreateUserDto {
  @ApiProperty({ type: 'string', required: true })
  name!: string;

  @ApiProperty({ type: 'string', format: 'email', required: true })
  email!: string;

  @ApiProperty({ type: 'integer', description: 'User age' })
  age!: number;

  @ApiProperty({ type: 'string', isArray: true })
  tags!: string[];

  @ApiProperty({ type: 'string', enum: ['active', 'inactive', 'pending'] })
  status!: string;

  @ApiProperty({ type: AddressDto, description: 'User address' })
  address!: AddressDto;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: 'string', format: 'uuid', example: '123e4567-e89b-12d3-a456-426614174000' })
  id!: string;
}
```

### @ApiHeader

Describes header parameters (can be applied at class or method level).

```typescript
@ApiHeader({
  name: string,                    // Header name
  description?: string,            // Header description
  required?: boolean,              // Whether required
  securityScheme?: SecurityScheme  // Optional security configuration
})
```

**Security Scheme:**
```typescript
interface SecurityScheme {
  name: string;
  type: 'apiKey' | 'http' | 'oauth2' | 'openIdConnect';
  scheme?: string;         // For 'http' type (e.g., 'bearer')
  bearerFormat?: string;   // For bearer tokens
  flows?: OAuthFlowsConfig; // For 'oauth2' type
}
```

**Examples:**
```typescript
// Class-level header (applies to all methods)
@ApiController('/api')
@ApiHeader({
  name: 'X-API-Version',
  description: 'API version',
  required: true
})
export class ApiController {
  // ...
}

// Method-level header
@ApiOperation({ method: 'GET', path: '/secure' })
@ApiHeader({
  name: 'Authorization',
  description: 'Bearer token',
  required: true,
  securityScheme: {
    name: 'bearerAuth',
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT'
  }
})
getSecureData() {}

// API Key security
@ApiHeader({
  name: 'X-API-KEY',
  description: 'API key for authentication',
  securityScheme: {
    name: 'apiKeyAuth',
    type: 'apiKey'
  }
})
```

## Complete Example

```typescript
import { Koatty } from 'koatty';
import { 
  KoattySwagger,
  ApiController,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiModel,
  ApiProperty,
  ApiHeader
} from 'koatty_swagger';

// Define DTOs
@ApiModel({ description: 'User information' })
class UserDto {
  @ApiProperty({ type: 'string', format: 'uuid', required: true })
  id!: string;

  @ApiProperty({ type: 'string', required: true })
  name!: string;

  @ApiProperty({ type: 'string', format: 'email', required: true })
  email!: string;
}

@ApiModel({ name: 'CreateUserInput', description: 'Input for creating a user' })
class CreateUserDto {
  @ApiProperty({ type: 'string', required: true })
  name!: string;

  @ApiProperty({ type: 'string', format: 'email', required: true })
  email!: string;
}

// Define Controller
@ApiController('/users', { tags: ['User Management'], description: 'User operations' })
@ApiHeader({ name: 'X-Request-ID', description: 'Unique request identifier' })
export class UserController {
  @ApiOperation({ 
    method: 'GET', 
    path: '/', 
    summary: 'List all users',
    tags: ['User']
  })
  @ApiResponse(200, 'List of users', { isArray: true, schema: UserDto })
  list() {}

  @ApiOperation({ 
    method: 'GET', 
    path: '/{id}', 
    summary: 'Get user by ID' 
  })
  @ApiParam({ name: 'id', in: 'path', description: 'User ID', type: String, required: true })
  @ApiResponse(200, 'User details', { schema: UserDto })
  @ApiResponse(404, 'User not found')
  getById() {}

  @ApiOperation({ 
    method: 'POST', 
    path: '/', 
    summary: 'Create a new user' 
  })
  @ApiParam({
    name: 'body',
    in: 'body',
    schema: CreateUserDto
  })
  @ApiResponse(201, 'User created', { schema: UserDto })
  @ApiResponse(400, 'Invalid input')
  create() {}
}

// Register middleware
const app = new Koatty();
app.use(KoattySwagger({
  title: 'User API',
  version: '1.0.0',
  description: 'API for user management',
  controllers: [UserController],
  jsonPath: '/swagger.json',
  uiPath: '/swagger-ui',
  servers: [{ url: 'http://localhost:3000' }]
}, app));
```

## Configuration Options

```typescript
interface SwaggerConfig {
  // Required
  title: string;                              // API title
  version: string;                            // API version
  controllers: any[];                         // Array of controller classes

  // Optional
  description?: string;                       // API description
  jsonPath?: string;                          // Path to serve OpenAPI JSON (default: '/swagger.json')
  uiPath?: string;                            // Path to serve Swagger UI (default: '/swagger-ui')
  servers?: Array<{                           // Server configurations
    url: string;
    description?: string;
  }>;
}
```

## Framework Version Compatibility

| koatty_swagger | Koatty | Node.js | TypeScript |
|----------------|--------|---------|------------|
| 1.0.x          | ^4.0.0 | >=18.0  | ^5.x       |

## Known Limitations

1. **Dual Decoration Requirement**: Methods must be decorated with both `@ApiOperation` AND the framework's HTTP method decorator (e.g., `@Get`, `@Post`). The `@ApiOperation` decorator is for documentation only and does not register routes.

   ```typescript
   // Correct: Both decorators required
   @ApiOperation({ method: 'GET', path: '/users' })
   @Get('/users')
   listUsers() {}

   // Incorrect: Missing HTTP method decorator - route won't work
   @ApiOperation({ method: 'GET', path: '/users' })
   listUsers() {}
   ```

2. **Model Inheritance**: When using class inheritance with `@ApiModel`, parent class properties decorated with `@ApiProperty` are inherited automatically.

3. **Parameter Type Inference**: For complex parameter types, use the `schema` option to provide explicit OpenAPI schema definitions.

4. **Reflect Metadata**: Ensure `reflect-metadata` is imported at the entry point of your application before any decorated classes are loaded.

## License

BSD-3-Clause

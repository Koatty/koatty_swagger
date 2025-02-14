import { ApiProperty } from "../src/decorators/property";
import { resolveSchema } from "../src/util/response";

// 测试用 DTO 类
class UserDTO {
  @ApiProperty()
  id: number;

  @ApiProperty()
  name: string;
}


class PostDTO {
  @ApiProperty()
  title: string;

  @ApiProperty({ type: UserDTO })
  author: UserDTO;
}

// 测试用例
describe('Schema Resolution', () => {
  test('1. 基本类型', () => {
    expect(resolveSchema(String)).toEqual({ type: 'string' });
    expect(resolveSchema(Number, true)).toEqual({
      type: 'array',
      items: { type: 'number' }
    });
  });

  test('2. 类引用', () => {
    const schema = resolveSchema(UserDTO);
    expect(schema).toEqual({
      $ref: '#/components/schemas/UserDTO'
    });
  });

  test('3. 类数组', () => {
    const schema = resolveSchema(UserDTO, true);
    expect(schema).toEqual({
      type: 'array',
      items: { $ref: '#/components/schemas/UserDTO' }
    });
  });

  test('4. 嵌套对象定义', () => {
    const schema = resolveSchema({
      data: {
        type: UserDTO,
        required: true
      },
      meta: {
        type: {
          page: { type: Number },
          total: { type: Number }
        }
      }
    });

    expect(schema).toEqual({
      type: 'object',
      properties: {
        data: { $ref: '#/components/schemas/UserDTO' },
        meta: {
          type: 'object',
          properties: {
            page: { type: 'number' },
            total: { type: 'number' }
          },
          required: []
        }
      },
      required: ['data']
    });
  });

  test('5. 混合类型嵌套', () => {
    const schema = resolveSchema(PostDTO);
    expect(schema).toEqual({
      $ref: '#/components/schemas/PostDTO'
    });

    // 验证 PostDTO 的实际结构
    const postSchema = resolveSchema({
      title: { type: String },
      author: { type: UserDTO }
    });

    expect(postSchema).toEqual({
      type: 'object',
      properties: {
        title: { type: 'string' },
        author: { $ref: '#/components/schemas/UserDTO' }
      },
      required: []
    });
  });

  test('6. 现有 SchemaObject 直接返回', () => {
    const existingSchema = {
      $ref: '#/components/schemas/Existing'
    };
    expect(resolveSchema(existingSchema)).toBe(existingSchema);

    const arraySchema = {
      type: 'array',
      items: { $ref: '#/components/schemas/Test' }
    };
    expect(resolveSchema(arraySchema, true)).toBe(arraySchema);
  });

  test('7. 循环引用处理', () => {
    class Node {
      @ApiProperty({ type: () => Node, isArray: true })
      children: Node[];
    }

    const schema = resolveSchema(Node);
    expect(schema).toEqual({
      $ref: '#/components/schemas/Node'
    });

    // 验证实际结构
    const nodeSchema = resolveSchema({
      children: {
        type: Node,
        isArray: true
      }
    });

    expect(nodeSchema).toEqual({
      type: 'object',
      properties: {
        children: {
          type: 'array',
          items: { $ref: '#/components/schemas/Node' }
        }
      },
      required: []
    });
  });
});

// 组件 Schemas 的完整定义测试
describe('Component Schemas Generation', () => {
  test('生成 UserDTO 组件 Schema', () => {
    const schema = resolveSchema({
      id: { type: Number },
      name: { type: String }
    });

    expect(schema).toEqual({
      type: 'object',
      properties: {
        id: { type: 'number' },
        name: { type: 'string' }
      },
      required: []
    });
  });

  test('生成带数组的 Schema', () => {
    class Collection {
      @ApiProperty({ type: String, isArray: true })
      items: string[];
    }

    const schema = resolveSchema(Collection);
    expect(schema).toEqual({
      $ref: '#/components/schemas/Collection'
    });

    // 验证实际结构
    const collectionSchema = resolveSchema({
      items: { type: String, isArray: true }
    });

    expect(collectionSchema).toEqual({
      type: 'object',
      properties: {
        items: {
          type: 'array',
          items: { type: 'string' }
        }
      },
      required: []
    });
  });
});

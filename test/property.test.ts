import { ApiModel } from '../src/decorators/model';
import { ApiProperty } from '../src/decorators/property';
import { generateSpec } from './test-utils';

describe('@ApiProperty 装饰器', () => {
  @ApiModel()
  class TestDTO {
    @ApiProperty()
    defaultString!: string;

    @ApiProperty({ type: Number })
    explicitNumber!: number;

    @ApiProperty({ required: false })
    optionalField?: string;

    @ApiProperty({ description: '用户年龄' })
    age!: number;

    @ApiProperty({ format: 'date-time', required: true })
    timestamp!: Date;

    @ApiProperty({ type: 'string', isArray: true })
    stringArray!: string[];

    @ApiProperty({ type: Number, isArray: true })
    implicitArray!: number[];

    @ApiProperty({ enum: ['A', 'B', 'C'] })
    enumField!: string;
  }

  @ApiModel()
  class NestedDTO {
    @ApiProperty()
    nestedField!: string;
  }

  @ApiModel()
  class RelationDTO {
    @ApiProperty({ type: NestedDTO })
    child!: NestedDTO;

    @ApiProperty({ type: NestedDTO, isArray: true })
    children!: NestedDTO[];
  }

  @ApiModel()
  class Node {
    @ApiProperty({ type: Node })
    parent!: Node;
  }

  @ApiModel()
  class Base {
    @ApiProperty()
    baseField!: string;
  }

  @ApiModel()
  class Derived extends Base {
    @ApiProperty()
    derivedField!: number;
  }

  const schemas: any = generateSpec().components.schemas;

  test('基本类型推断', () => {
    const props = schemas.TestDTO.properties;
    expect(props.defaultString).toHaveProperty("type", 'string');
    expect(props.explicitNumber).toHaveProperty("type", 'number');
    expect(props.implicitArray).toEqual({
      type: 'array',
      items: { type: 'number' }
    });
  });

  test('配置选项处理', () => {
    const ageProp = schemas.TestDTO.properties.age;
    expect(ageProp).toEqual({
      type: 'number',
      description: '用户年龄'
    });

    expect(schemas.TestDTO.required).toEqual([
      'timestamp',
      'enumField'
    ]);
  });

  test('嵌套DTO处理', () => {
    const relationProps = schemas.RelationDTO.properties;
    expect(relationProps.child).toEqual({
      // name: 'child',
      type: 'object',
      $ref: '#/components/schemas/NestedDTO'
    });
    expect(relationProps.children).toEqual({
      // name: 'children',
      type: 'array',
      // isArray: true,
      items: { type: 'object', $ref: '#/components/schemas/NestedDTO' }
    });
  });

  test('枚举类型处理', () => {
    const enumProp = schemas.TestDTO.properties.enumField;
    expect(enumProp).toEqual({
      // name: 'enumField',
      type: 'string',
      required: true,
      enum: ['A', 'B', 'C']
    });
  });

  test('日期格式处理', () => {
    const dateProp = schemas.TestDTO.properties.timestamp;
    expect(dateProp).toEqual({
      // name: 'timestamp',
      type: 'string',
      required: true,
      format: 'date-time'
    });
  });

  test('可选字段处理', () => {
    const optionalProp = schemas.TestDTO.properties.optionalField;
    expect(optionalProp).toEqual({ type: 'string' });
    expect(schemas.TestDTO.required).not.toContain('optionalField');
  });

  test('循环引用处理', () => {
    const schema: any = schemas.Node;
    expect(schema.properties.parent).toEqual({
      // name: 'parent',
      type: 'object',
      $ref: '#/components/schemas/Node'
    });
  });

  test('继承属性合并', () => {
    const schema = schemas.Derived;
    expect(schema.allOf).toContainEqual({
      $ref: '#/components/schemas/Base'
    });
    console.log('schema :', JSON.stringify(schema, null, 2));
    expect(schema.allOf).toEqual(expect.arrayContaining([{
      "type": "object",
      "properties": {
        "derivedField": {
          "type": "number"
        }
      },
      "required": []
    }]));
  });
});

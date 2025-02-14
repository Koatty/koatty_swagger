
import { ApiModel } from '../src/decorators/model';
import { ApiProperty } from '../src/decorators/property';
import { API_MODEL_KEY } from '../src/util/key-type';
import { modelRegistry } from '../src/util/model-registry';
import { generateSpec } from './test-utils';

describe('@ApiModel 装饰器', () => {
  test('基础模型注册', () => {
    @ApiModel()
    class BasicModel {
      @ApiProperty()
      id!: number;
    }

    const spec = generateSpec();
    expect(spec.components.schemas).toHaveProperty('BasicModel');
    const models = modelRegistry.listModels();
    expect(models.length).toBe(1);
    expect(models[0].target).toBe(BasicModel);
  });

  test('自定义模型名称', () => {
    @ApiModel({ name: 'CustomModel' })
    class OriginalName { }

    const metadata = Reflect.getMetadata(API_MODEL_KEY, OriginalName);
    expect(metadata.name).toBe('CustomModel');
    const spec = generateSpec();
    expect(spec.components.schemas).toHaveProperty('CustomModel');
  });

  test('继承模型处理', () => {
    @ApiModel({ description: '基类' })
    class BaseModel {
      @ApiProperty()
      createdAt!: Date;
    }

    @ApiModel()
    class SubModel extends BaseModel {
      @ApiProperty()
      name!: string;
    }

    const schema = modelRegistry.get(SubModel);
    console.log('SubModel schema:', JSON.stringify(schema, null, 2));
    expect(schema).toMatchObject({
      allOf: [
        { $ref: '#/components/schemas/BaseModel' },
        {
          type: 'object',
          properties: {
            name: { type: 'string' }
          },
          // required: ['name']
        }
      ],
      description: undefined
    });
  });

  test('多层继承链', () => {
    @ApiModel()
    class GrandParent {
      @ApiProperty()
      gene!: string;
    }

    @ApiModel()
    class Parent extends GrandParent {
      @ApiProperty()
      parentProp!: number;
    }

    @ApiModel({ description: '最终子类' })
    class Child extends Parent {
      @ApiProperty()
      childProp!: boolean;
    }

    const childSchema = modelRegistry.get(Child);
    expect(childSchema).toEqual({
      allOf: [
        { $ref: '#/components/schemas/Parent' },
        {
          type: 'object',
          properties: {
            childProp: { type: 'boolean' }
          },
          required: []
        }
      ],
      description: '最终子类'
    });
  });

  //   test('同名模型覆盖警告', () => {
  //     @ApiModel({ name: 'ConflictModel' })
  //     class ModelA { }

  //     const warn = jest.spyOn(console, 'warn');

  //     @ApiModel({ name: 'ConflictModel' })
  //     class ModelB { }

  //     expect(warn).toHaveBeenCalledWith(
  //       '模型名称 ConflictModel 已被注册，当前类: ModelB'
  //     );
  //   });

  test('未装饰父类处理', () => {
    class UndecoratedBase {
      @ApiProperty()
      baseProp!: string;
    }

    @ApiModel()
    class SubClass extends UndecoratedBase { }

    const schema = modelRegistry.get(SubClass);
    expect(schema.properties).not.toHaveProperty('baseProp');
  });

});

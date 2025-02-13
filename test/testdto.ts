import { ApiModel } from "../src/decorators/model";
import { ApiProperty } from "../src/decorators/property";

@ApiModel({ description: '用户详细信息' })
export class UserDetailDto {
  @ApiProperty({ type: 'nickname' })
  nickname!: string;

  @ApiProperty({ type: 'string', isArray: true })
  address!: string[];
}

@ApiModel({ description: '基础实体' })
class BaseEntity {
  @ApiProperty({ type: 'string', format: 'uuid' })
  id!: string;

  @ApiProperty({ type: 'string', format: 'date-time' })
  createdAt!: Date;
}

@ApiModel({ name: "CreateUser", description: '用户信息' })
export class CreateUserDto extends BaseEntity {
  @ApiProperty({ type: 'string' })
  name!: string;

  @ApiProperty({ type: 'integer' })
  age!: number;

  @ApiProperty({ type: UserDetailDto })
  detail!: UserDetailDto;
}
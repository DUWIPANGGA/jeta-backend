import {IsString} from 'class-validator';

export class CreateRoleDto {
    @IsString()
    name: String;

    @IsString()
    description: String;
}

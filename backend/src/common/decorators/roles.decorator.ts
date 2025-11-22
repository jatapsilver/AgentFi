import { SetMetadata } from '@nestjs/common';
import { RolesEnum } from '../enums/roles.enum';

export const rolesKey = 'roles';
export const Roles = (...roles: RolesEnum[]) => SetMetadata(rolesKey, roles);

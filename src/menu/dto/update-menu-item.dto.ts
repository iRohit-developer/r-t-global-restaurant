import { PartialType } from '@nestjs/swagger';
import { CreateMenuItemDto } from './create-menu-item.dto';

export class UpdateMenuItemDto extends PartialType(CreateMenuItemDto) {}
/*
UpdateMenuItemDto` is created from `CreateMenuItemDto` using `PartialType`, 
which makes all its fields optional. 
This lets you reuse the same structure and validations while 
allowing updates (especially for PATCH requests) to send only the fields 
that need to change—keeping your code clean, consistent, and DRY.
*/

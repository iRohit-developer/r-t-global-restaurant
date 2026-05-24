import { BadRequestException } from '@nestjs/common';

export class MenuItemUnavailableException extends BadRequestException {
	constructor(menuItemId: number) {
		super(`Menu item ${menuItemId} is currently unavailable`);
	}
}

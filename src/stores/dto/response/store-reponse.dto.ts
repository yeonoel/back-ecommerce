export class StoreDto {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    whatsappNumber?: string;
}

export class UserDto {
    id: string;
    phone: string;
    firstName?: string;
}

export class CreateStoreResponseDto {
    success: boolean;
    message: string;
    data: {
        store: StoreDto;
        user: UserDto;
    };
}
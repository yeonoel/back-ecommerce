export class StoreDto {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    whatsappNumber?: string;
    storeUrl?: string;
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

export class StoreResponseDto {
    id: string;
    name: string;
    slug: string;
    description?: string;
    logoUrl?: string;
    whatsappNumber?: string;
    status: string;
    storeUrl: string; // ✅ calculé, pas stocké
    createdAt: Date;
    updatedAt: Date;
    owner: {
        id: string;
        firstName?: string;
        phone: string;
        role: string;
    };
}
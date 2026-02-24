import { User } from "src/users/entities/user.entity"
import { UserDataDto } from "../dto/Users-response"

export const mapToUserDto = (user: User): UserDataDto => {
    return {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone
    }
}
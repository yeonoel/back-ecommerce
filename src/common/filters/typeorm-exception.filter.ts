// filters/typeorm-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ConflictException,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

@Catch(QueryFailedError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError) {
    const message = (exception as any).message;

    if (message.includes('unique') || message.includes('duplicate')) {
      throw new ConflictException('Resource already exists');
    }

    throw exception;
  }
}

import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        // Si c'est une HttpException NestJS (NotFoundException, UnauthorizedException etc.)
        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const exceptionResponse = exception.getResponse();

            // NestJS peut renvoyer un string ou un objet
            const message =
                typeof exceptionResponse === 'string'
                    ? exceptionResponse
                    : (exceptionResponse as any).message ?? 'Une erreur est survenue';

            return response.status(status).json({
                success: false,
                statusCode: status,
                message,
                timestamp: new Date().toISOString(),
            });
        }

        // Erreur inattendue (bug, erreur base de données etc.)
        console.error('Unexpected error:', exception);
        return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            statusCode: 500,
            message: 'Erreur interne du serveur',
            timestamp: new Date().toISOString(),
        });
    }
}
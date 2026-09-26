import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  
  @Catch(HttpException)
  export class HttpExceptionsFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
      const response = ctx.getResponse();
  
      const statusCode =
        exception instanceof HttpException
          ? exception.getStatus()
          : HttpStatus.INTERNAL_SERVER_ERROR;
  
      let exceptionMessage: string | any = exception.getResponse();
      if (typeof exceptionMessage === 'object' && exceptionMessage.message) {
        if (Array.isArray(exceptionMessage.message)) {
          exceptionMessage = exceptionMessage.message[0];
        } else {
          exceptionMessage = exceptionMessage.message || 'Unknown Error';
        }
      }
      response.status(statusCode).json({
        statusCode,
        message: exceptionMessage,
        data: {},
      });
    }
  }
  
import { Response } from 'express';
import { ResponseHandler } from './response';

describe('ResponseHandler', () => {
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    sendMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    
    mockResponse = {
      status: statusMock,
      json: jsonMock,
      send: sendMock,
    };
  });

  describe('success', () => {
    it('should return success response with default message', () => {
      const data = { id: 1, name: 'Test' };
      
      ResponseHandler.success(mockResponse as Response, data);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data,
      });
    });

    it('should return success response with custom message', () => {
      const data = { id: 1 };
      const message = 'Custom success message';
      
      ResponseHandler.success(mockResponse as Response, data, message);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message,
        data,
      });
    });

    it('should return success response with custom status code', () => {
      const data = null;
      const message = 'Created';
      const statusCode = 201;
      
      ResponseHandler.success(mockResponse as Response, data, message, statusCode);

      expect(statusMock).toHaveBeenCalledWith(statusCode);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message,
        data,
      });
    });
  });

  describe('error', () => {
    it('should return error response with default message', () => {
      ResponseHandler.error(mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'An error occurred',
        errors: undefined,
      });
    });

    it('should return error response with custom message and status', () => {
      const message = 'Not found';
      const statusCode = 404;
      
      ResponseHandler.error(mockResponse as Response, message, statusCode);

      expect(statusMock).toHaveBeenCalledWith(statusCode);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: message,
        errors: undefined,
      });
    });

    it('should return error response with validation errors', () => {
      const message = 'Validation failed';
      const errors = [
        { field: 'email', message: 'Invalid email' },
        { field: 'password', message: 'Too weak' },
      ];
      
      ResponseHandler.error(mockResponse as Response, message, 400, errors);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: message,
        errors,
      });
    });
  });

  describe('paginated', () => {
    it('should return paginated response', () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const page = 1;
      const limit = 10;
      const total = 25;
      
      ResponseHandler.paginated(mockResponse as Response, data, page, limit, total);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Success',
        data,
        meta: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
        },
      });
    });

    it('should calculate correct total pages', () => {
      const data: any[] = [];
      const testCases = [
        { total: 100, limit: 10, expectedPages: 10 },
        { total: 95, limit: 10, expectedPages: 10 },
        { total: 91, limit: 10, expectedPages: 10 },
        { total: 90, limit: 10, expectedPages: 9 },
        { total: 0, limit: 10, expectedPages: 0 },
        { total: 1, limit: 10, expectedPages: 1 },
      ];

      testCases.forEach(({ total, limit, expectedPages }) => {
        ResponseHandler.paginated(mockResponse as Response, data, 1, limit, total);
        const lastCall = jsonMock.mock.calls[jsonMock.mock.calls.length - 1][0];
        expect(lastCall.meta.totalPages).toBe(expectedPages);
      });
    });
  });

  describe('created', () => {
    it('should return created response', () => {
      const data = { id: 1, created: true };
      
      ResponseHandler.created(mockResponse as Response, data);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Resource created successfully',
        data,
      });
    });
  });

  describe('noContent', () => {
    it('should return 204 no content', () => {
      ResponseHandler.noContent(mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });
  });

  describe('badRequest', () => {
    it('should return bad request response', () => {
      ResponseHandler.badRequest(mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Bad request',
        errors: undefined,
      });
    });

    it('should return bad request with custom message and errors', () => {
      const message = 'Invalid input';
      const errors = [{ field: 'name', message: 'Required' }];
      
      ResponseHandler.badRequest(mockResponse as Response, message, errors);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: message,
        errors,
      });
    });
  });

  describe('unauthorized', () => {
    it('should return unauthorized response', () => {
      ResponseHandler.unauthorized(mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Unauthorized',
        errors: undefined,
      });
    });
  });

  describe('forbidden', () => {
    it('should return forbidden response', () => {
      ResponseHandler.forbidden(mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Forbidden',
        errors: undefined,
      });
    });
  });

  describe('notFound', () => {
    it('should return not found response', () => {
      ResponseHandler.notFound(mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Resource not found',
        errors: undefined,
      });
    });
  });

  describe('conflict', () => {
    it('should return conflict response', () => {
      ResponseHandler.conflict(mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Conflict',
        errors: undefined,
      });
    });
  });

  describe('serverError', () => {
    it('should return server error response', () => {
      ResponseHandler.serverError(mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Internal server error',
        errors: undefined,
      });
    });
  });
});

export {};
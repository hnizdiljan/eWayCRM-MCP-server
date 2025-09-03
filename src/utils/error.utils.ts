import { Response } from 'express';
import logger from '../services/logger.service';
import { HTTP_STATUS, ERROR_MESSAGES } from '../constants/api.constants';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: any, res: Response, operation: string): void {
  logger.error(`${operation} failed`, { error });

  if (error instanceof ApiError) {
    res.status(error.statusCode).json({
      error: error.message,
      details: error.details
    });
    return;
  }

  const message = error instanceof Error ? error.message : ERROR_MESSAGES.INTERNAL_ERROR;
  const statusCode = determineStatusCode(error);

  res.status(statusCode).json({
    error: message,
    timestamp: new Date().toISOString()
  });
}

function determineStatusCode(error: any): number {
  if (error.message?.includes('nebyl nalezen') || error.message?.includes('not found')) {
    return HTTP_STATUS.NOT_FOUND;
  }
  if (error.message?.includes('validace') || error.message?.includes('validation')) {
    return HTTP_STATUS.BAD_REQUEST;
  }
  if (error.message?.includes('připojení') || error.message?.includes('connection')) {
    return HTTP_STATUS.SERVICE_UNAVAILABLE;
  }
  return HTTP_STATUS.INTERNAL_SERVER_ERROR;
}

export function createSuccessResponse<T>(data: T, message?: string): any {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  };
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  limit: number,
  offset: number
): any {
  return {
    data,
    pagination: {
      total,
      limit,
      offset,
      hasMore: (offset + limit) < total,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(total / limit)
    }
  };
}
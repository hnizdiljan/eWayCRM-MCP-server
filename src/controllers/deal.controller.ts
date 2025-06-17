import { Request, Response } from 'express';
import dealService from '../services/deal.service';
import logger from '../services/logger.service';
import { CreateDealDto } from '../models/deal.dto';

/**
 * Controller pro správu obchodů/příležitostí
 * Implementuje REST API endpointy
 */
export class DealController {
  
  /**
   * GET /api/v1/deals
   * Získání všech obchodů s možností vyhledávání a stránkování
   */
  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const validatedQuery = (req as any).validatedQuery || {};
      const query = validatedQuery.q;
      const limit = validatedQuery.limit || 25;
      const offset = validatedQuery.offset || 0;
      
      logger.debug('Požadavek na seznam obchodů', { query, limit, offset });
      
      const result = await dealService.getAll(query, limit, offset);
      
      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          hasMore: result.hasMore,
          page: Math.floor(result.offset / result.limit) + 1,
          totalPages: Math.ceil(result.total / result.limit)
        }
      });
      
    } catch (error) {
      logger.error('Chyba při získávání seznamu obchodů', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Chyba při získávání obchodů',
          details: error instanceof Error ? error.message : 'Neznámá chyba'
        }
      });
    }
  }
  
  /**
   * GET /api/v1/deals/:id
   * Získání konkrétního obchodu podle ID
   */
  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      logger.debug('Požadavek na obchod podle ID', { id });
      
      const deal = await dealService.getById(id);
      
      if (!deal) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Obchod s ID ${id} nebyl nalezen`
          }
        });
        return;
      }
      
      res.json({
        success: true,
        data: deal
      });
      
    } catch (error) {
      logger.error('Chyba při získávání obchodu podle ID', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Chyba při získávání obchodu',
          details: error instanceof Error ? error.message : 'Neznámá chyba'
        }
      });
    }
  }
  
  /**
   * POST /api/v1/deals
   * Vytvoření nového obchodu
   */
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const dealData: CreateDealDto = req.body;
      
      logger.debug('Požadavek na vytvoření obchodu', { projectName: dealData.projectName });
      
      const createdDeal = await dealService.create(dealData);
      
      res.status(201).json({
        success: true,
        data: createdDeal,
        message: 'Obchod byl úspěšně vytvořen'
      });
      
    } catch (error) {
      logger.error('Chyba při vytváření obchodu', error);
      
      // Zkontrolujeme typ chyby pro vhodnější HTTP status
      let statusCode = 500;
      let errorCode = 'INTERNAL_ERROR';
      
      if (error instanceof Error) {
        if (error.message.includes('povinný')) {
          statusCode = 400;
          errorCode = 'VALIDATION_ERROR';
        } else if (error.message.includes('existuje')) {
          statusCode = 409;
          errorCode = 'CONFLICT';
        }
      }
      
      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: 'Chyba při vytváření obchodu',
          details: error instanceof Error ? error.message : 'Neznámá chyba'
        }
      });
    }
  }
  
  /**
   * PUT /api/v1/deals/:id
   * Aktualizace existujícího obchodu
   */
  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const dealData: CreateDealDto = req.body;
      const itemVersion = req.body.itemVersion ? parseInt(req.body.itemVersion) : undefined;
      
      logger.debug('Požadavek na aktualizaci obchodu', { 
        id, 
        projectName: dealData.projectName,
        itemVersion 
      });
      
      const updatedDeal = await dealService.update(id, dealData, itemVersion);
      
      res.json({
        success: true,
        data: updatedDeal,
        message: 'Obchod byl úspěšně aktualizován'
      });
      
    } catch (error) {
      logger.error('Chyba při aktualizaci obchodu', error);
      
      // Zkontrolujeme typ chyby pro vhodnější HTTP status
      let statusCode = 500;
      let errorCode = 'INTERNAL_ERROR';
      
      if (error instanceof Error) {
        if (error.message.includes('nebyl nalezen')) {
          statusCode = 404;
          errorCode = 'NOT_FOUND';
        } else if (error.message.includes('byl mezitím změněn')) {
          statusCode = 409;
          errorCode = 'CONFLICT';
        } else if (error.message.includes('povinný')) {
          statusCode = 400;
          errorCode = 'VALIDATION_ERROR';
        }
      }
      
      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: 'Chyba při aktualizaci obchodu',
          details: error instanceof Error ? error.message : 'Neznámá chyba'
        }
      });
    }
  }
  
  /**
   * DELETE /api/v1/deals/:id
   * Smazání obchodu
   */
  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      logger.debug('Požadavek na smazání obchodu', { id });
      
      await dealService.delete(id);
      
      res.status(204).send(); // No Content
      
    } catch (error) {
      logger.error('Chyba při mazání obchodu', error);
      
      // Zkontrolujeme typ chyby pro vhodnější HTTP status
      let statusCode = 500;
      let errorCode = 'INTERNAL_ERROR';
      
      if (error instanceof Error && error.message.includes('nebyl nalezen')) {
        statusCode = 404;
        errorCode = 'NOT_FOUND';
      }
      
      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: 'Chyba při mazání obchodu',
          details: error instanceof Error ? error.message : 'Neznámá chyba'
        }
      });
    }
  }

  /**
   * GET /api/v1/deals/by-company/:companyId
   * Získání obchodů podle společnosti
   */
  public async getByCompanyId(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      const validatedQuery = (req as any).validatedQuery || {};
      const limit = validatedQuery.limit || 25;
      const offset = validatedQuery.offset || 0;
      
      logger.debug('Požadavek na obchody podle společnosti', { companyId, limit, offset });
      
      const result = await dealService.getByCompanyId(companyId, limit, offset);
      
      res.json({
        success: true,
        data: result.data,
        pagination: {
          total: result.total,
          limit: result.limit,
          offset: result.offset,
          hasMore: result.hasMore,
          page: Math.floor(result.offset / result.limit) + 1,
          totalPages: Math.ceil(result.total / result.limit)
        }
      });
      
    } catch (error) {
      logger.error('Chyba při získávání obchodů podle společnosti', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Chyba při získávání obchodů podle společnosti',
          details: error instanceof Error ? error.message : 'Neznámá chyba'
        }
      });
    }
  }
}

// Singleton instance
const dealController = new DealController();
export default dealController; 
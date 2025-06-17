import { Request, Response } from 'express';
import companyService from '../services/company.service';
import logger from '../services/logger.service';
import { CreateCompanyDto } from '../models/company.dto';

/**
 * Controller pro správu společností
 * Implementuje REST API endpointy
 */
export class CompanyController {
  
  /**
   * GET /api/v1/companies
   * Získání všech společností s možností vyhledávání a stránkování
   */
  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const validatedQuery = (req as any).validatedQuery || {};
      const query = validatedQuery.q;
      const limit = validatedQuery.limit || 25;
      const offset = validatedQuery.offset || 0;
      
      logger.debug('Požadavek na seznam společností', { query, limit, offset });
      
      const result = await companyService.getAll(query, limit, offset);
      
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
      logger.error('Chyba při získávání seznamu společností', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Chyba při získávání společností',
          details: error instanceof Error ? error.message : 'Neznámá chyba'
        }
      });
    }
  }
  
  /**
   * GET /api/v1/companies/:id
   * Získání konkrétní společnosti podle ID
   */
  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      logger.debug('Požadavek na společnost podle ID', { id });
      
      const company = await companyService.getById(id);
      
      if (!company) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Společnost s ID ${id} nebyla nalezena`
          }
        });
        return;
      }
      
      res.json({
        success: true,
        data: company
      });
      
    } catch (error) {
      logger.error('Chyba při získávání společnosti podle ID', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Chyba při získávání společnosti',
          details: error instanceof Error ? error.message : 'Neznámá chyba'
        }
      });
    }
  }
  
  /**
   * POST /api/v1/companies
   * Vytvoření nové společnosti
   */
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const companyData: CreateCompanyDto = req.body;
      
      logger.debug('Požadavek na vytvoření společnosti', { companyName: companyData.companyName });
      
      const createdCompany = await companyService.create(companyData);
      
      res.status(201).json({
        success: true,
        data: createdCompany,
        message: 'Společnost byla úspěšně vytvořena'
      });
      
    } catch (error) {
      logger.error('Chyba při vytváření společnosti', error);
      
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
          message: 'Chyba při vytváření společnosti',
          details: error instanceof Error ? error.message : 'Neznámá chyba'
        }
      });
    }
  }
  
  /**
   * PUT /api/v1/companies/:id
   * Aktualizace existující společnosti
   */
  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const companyData: CreateCompanyDto = req.body;
      const itemVersion = req.body.itemVersion ? parseInt(req.body.itemVersion) : undefined;
      
      logger.debug('Požadavek na aktualizaci společnosti', { 
        id, 
        companyName: companyData.companyName,
        itemVersion 
      });
      
      const updatedCompany = await companyService.update(id, companyData, itemVersion);
      
      res.json({
        success: true,
        data: updatedCompany,
        message: 'Společnost byla úspěšně aktualizována'
      });
      
    } catch (error) {
      logger.error('Chyba při aktualizaci společnosti', error);
      
      // Zkontrolujeme typ chyby pro vhodnější HTTP status
      let statusCode = 500;
      let errorCode = 'INTERNAL_ERROR';
      
      if (error instanceof Error) {
        if (error.message.includes('nebyla nalezena')) {
          statusCode = 404;
          errorCode = 'NOT_FOUND';
        } else if (error.message.includes('byla mezitím změněna')) {
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
          message: 'Chyba při aktualizaci společnosti',
          details: error instanceof Error ? error.message : 'Neznámá chyba'
        }
      });
    }
  }
  
  /**
   * DELETE /api/v1/companies/:id
   * Smazání společnosti
   */
  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      logger.debug('Požadavek na smazání společnosti', { id });
      
      await companyService.delete(id);
      
      res.json({
        success: true,
        message: 'Společnost byla úspěšně smazána'
      });
      
    } catch (error) {
      logger.error('Chyba při mazání společnosti', error);
      
      // Zkontrolujeme typ chyby pro vhodnější HTTP status
      let statusCode = 500;
      let errorCode = 'INTERNAL_ERROR';
      
      if (error instanceof Error && error.message.includes('nebyla nalezena')) {
        statusCode = 404;
        errorCode = 'NOT_FOUND';
      }
      
      res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode,
          message: 'Chyba při mazání společnosti',
          details: error instanceof Error ? error.message : 'Neznámá chyba'
        }
      });
    }
  }
}

export default new CompanyController(); 
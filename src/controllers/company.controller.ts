import { Request, Response } from 'express';
import companyService from '../services/company.service';
import logger from '../services/logger.service';
import { CreateCompanyDto } from '../models/company.dto';
import { handleApiError, createSuccessResponse, createPaginatedResponse } from '../utils/error.utils';
import { HTTP_STATUS } from '../constants/api.constants';
import ewayConnector from '../connectors/eway-http.connector';

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
      
      // Debug auth status  
      const authStatus = (ewayConnector as any).getAuthStatus();
      console.log('🔍 AUTH STATUS:', authStatus);
      
      const result = await companyService.getAll(query, limit, offset);
      
      const response = createPaginatedResponse(result.data, result.total, result.limit, result.offset);
      res.status(HTTP_STATUS.OK).json(response);
      
    } catch (error) {
      handleApiError(error, res, 'Získávání společností');
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
        res.status(HTTP_STATUS.NOT_FOUND).json({
          error: `Společnost s ID ${id} nebyla nalezena`
        });
        return;
      }
      
      res.status(HTTP_STATUS.OK).json(createSuccessResponse(company));
      
    } catch (error) {
      handleApiError(error, res, 'Získávání společnosti');
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
      
      res.status(HTTP_STATUS.CREATED).json(
        createSuccessResponse(createdCompany, 'Společnost byla úspěšně vytvořena')
      );
      
    } catch (error) {
      handleApiError(error, res, 'Vytváření společnosti');
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
      
      res.status(HTTP_STATUS.OK).json(
        createSuccessResponse(updatedCompany, 'Společnost byla úspěšně aktualizována')
      );
      
    } catch (error) {
      handleApiError(error, res, 'Aktualizace společnosti');
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
      
      res.status(HTTP_STATUS.NO_CONTENT).send();
      
    } catch (error) {
      handleApiError(error, res, 'Mazání společnosti');
    }
  }
}

export default new CompanyController(); 
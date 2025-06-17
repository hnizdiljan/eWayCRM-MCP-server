import { Request, Response } from 'express';
import contactService from '../services/contact.service';
import logger from '../services/logger.service';
import { CreateContactDto } from '../models/contact.dto';

/**
 * Controller pro správu kontaktů
 * Implementuje REST API endpointy
 */
export class ContactController {
  
  /**
   * GET /api/v1/contacts
   * Získání všech kontaktů s možností vyhledávání a stránkování
   */
  public async getAll(req: Request, res: Response): Promise<void> {
    try {
      const validatedQuery = (req as any).validatedQuery || {};
      const query = validatedQuery.q;
      const limit = validatedQuery.limit || 25;
      const offset = validatedQuery.offset || 0;
      
      logger.debug('Požadavek na seznam kontaktů', { query, limit, offset });
      
      const result = await contactService.getAll(query, limit, offset);
      
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
      logger.error('Chyba při získávání seznamu kontaktů', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Chyba při získávání kontaktů',
          details: error instanceof Error ? error.message : 'Neznámá chyba'
        }
      });
    }
  }
  
  /**
   * GET /api/v1/contacts/:id
   * Získání konkrétního kontaktu podle ID
   */
  public async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      logger.debug('Požadavek na kontakt podle ID', { id });
      
      const contact = await contactService.getById(id);
      
      if (!contact) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: `Kontakt s ID ${id} nebyl nalezen`
          }
        });
        return;
      }
      
      res.json({
        success: true,
        data: contact
      });
      
    } catch (error) {
      logger.error('Chyba při získávání kontaktu podle ID', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Chyba při získávání kontaktu',
          details: error instanceof Error ? error.message : 'Neznámá chyba'
        }
      });
    }
  }
  
  /**
   * POST /api/v1/contacts
   * Vytvoření nového kontaktu
   */
  public async create(req: Request, res: Response): Promise<void> {
    try {
      const contactData: CreateContactDto = req.body;
      
      logger.debug('Požadavek na vytvoření kontaktu', { 
        firstName: contactData.firstName,
        lastName: contactData.lastName 
      });
      
      const createdContact = await contactService.create(contactData);
      
      res.status(201).json({
        success: true,
        data: createdContact,
        message: 'Kontakt byl úspěšně vytvořen'
      });
      
    } catch (error) {
      logger.error('Chyba při vytváření kontaktu', error);
      
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
          message: 'Chyba při vytváření kontaktu',
          details: error instanceof Error ? error.message : 'Neznámá chyba'
        }
      });
    }
  }
  
  /**
   * PUT /api/v1/contacts/:id
   * Aktualizace existujícího kontaktu
   */
  public async update(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const contactData: CreateContactDto = req.body;
      const itemVersion = req.body.itemVersion ? parseInt(req.body.itemVersion) : undefined;
      
      logger.debug('Požadavek na aktualizaci kontaktu', { 
        id, 
        firstName: contactData.firstName,
        lastName: contactData.lastName,
        itemVersion 
      });
      
      const updatedContact = await contactService.update(id, contactData, itemVersion);
      
      res.json({
        success: true,
        data: updatedContact,
        message: 'Kontakt byl úspěšně aktualizován'
      });
      
    } catch (error) {
      logger.error('Chyba při aktualizaci kontaktu', error);
      
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
          message: 'Chyba při aktualizaci kontaktu',
          details: error instanceof Error ? error.message : 'Neznámá chyba'
        }
      });
    }
  }
  
  /**
   * DELETE /api/v1/contacts/:id
   * Smazání kontaktu
   */
  public async delete(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      logger.debug('Požadavek na smazání kontaktu', { id });
      
      await contactService.delete(id);
      
      res.json({
        success: true,
        message: 'Kontakt byl úspěšně smazán'
      });
      
    } catch (error) {
      logger.error('Chyba při mazání kontaktu', error);
      
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
          message: 'Chyba při mazání kontaktu',
          details: error instanceof Error ? error.message : 'Neznámá chyba'
        }
      });
    }
  }
  
  /**
   * GET /api/v1/companies/:companyId/contacts
   * Získání kontaktů konkrétní společnosti
   */
  public async getByCompanyId(req: Request, res: Response): Promise<void> {
    try {
      const { companyId } = req.params;
      const validatedQuery = (req as any).validatedQuery || {};
      const limit = validatedQuery.limit || 25;
      const offset = validatedQuery.offset || 0;
      
      logger.debug('Požadavek na kontakty podle společnosti', { companyId, limit, offset });
      
      const result = await contactService.getByCompanyId(companyId, limit, offset);
      
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
      logger.error('Chyba při získávání kontaktů podle společnosti', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Chyba při získávání kontaktů podle společnosti',
          details: error instanceof Error ? error.message : 'Neznámá chyba'
        }
      });
    }
  }
}

export default new ContactController(); 
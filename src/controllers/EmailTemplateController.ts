import { Express, NextFunction, Request, Response } from 'express';
import { EmailTemplate, emailTemplateRepository } from '../collections/emailTemplate';
import { assignObject } from '../services/utils';

export default class EmailTemplateController {
  public static routes(app: Express) {
    app.get('/email-templates', this.getEmailTemplates);
    app.get('/email-templates/:id', this.getEmailTemplate);
    app.post('/email-templates', this.createEmailTemplate);
    app.put('/email-templates/:id', this.updateEmailTemplate);
  }

  public static async getEmailTemplates(req: Request, res: Response, next: NextFunction) {
    const documents = await emailTemplateRepository.find();
    return res.json({
      documents,
    });
  }

  public static async getEmailTemplate(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id;
    const document = await emailTemplateRepository.findById(id);
    return res.json({
      document
    });
  }

  public static async createEmailTemplate(req: Request, res: Response, next: NextFunction) {
    const template = assignObject(new EmailTemplate(), req.body);
    if (!template.name || !template.subject || !template.content) {
      return res.status(400).json({ message: 'Bad Request' });
    }

    const document = await emailTemplateRepository.create(template);
    return res.json({
      document
    });
  }

  public static async updateEmailTemplate(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id;
    const document = await emailTemplateRepository.findById(id);
    if (!document) {
      return res.status(400).json({ message: 'Bad Request' });
    }

    assignObject(document, req.body);
    const newDocument = await emailTemplateRepository.update(document);

    return res.json({
      document: newDocument
    });
  }
}

import { NextFunction, Request, Response, Express } from "express";
import { Contact, ContactLog, contactLogRepository, contactRepository } from "../collections/contact";
import MailService from "../services/MailService";
import { assignObject } from "../services/utils";

export default class ContactController {
  public static routes(app: Express) {
    app.get('/contacts', this.getContacts);
    app.post('/contacts', this.createContact);
    app.get('/contacts/merge-tags', this.getEmailMergeTags);

    app.get('/contacts/:id', this.getContact);
    app.put('/contacts/:id', this.updateContact);

    app.get('/contacts/:id/logs', this.getContactLogs);
    app.post('/contacts/:id/logs', this.addLog);

    app.post('/contacts/:id/send-mail', this.sendMail);
  }

  public static async getContacts(req: Request, res: Response, next: NextFunction) {
    const documents = await contactRepository.find();
    return res.json({
      documents,
    });
  }

  public static async createContact(req: Request, res: Response, next: NextFunction) {
    const contact = assignObject(new Contact(), req.body);
    if (!contact.email) {
      return res.status(400).json({ message: 'Bad Request' });
    }

    // check exist email
    const duplicate = await contactRepository.whereEqualTo('email', contact.email).findOne();
    if (duplicate) {
      return res.json({
        error: true,
        message: 'Exist email',
        document: duplicate,
      });
    }
    
    // create
    const document = await contactRepository.create(contact);
    return res.json({
      document
    });
  }

  public static async getContact(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id;
    const document = await contactRepository.findById(id);
    return res.json({
      document
    });
  }

  public static async updateContact(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id;
    const document = await contactRepository.findById(id);
    if (!document) {
      return res.status(400).json({ message: 'Bad Request' });
    }

    assignObject(document, req.body);
    const newDocument = await contactRepository.update(document);

    return res.json({
      document: newDocument
    });
  }

  public static async getContactLogs(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id;
    const logs = await contactLogRepository.whereEqualTo('contactId', id).find();
    return res.json({
      documents: logs,
    });
  }

  public static async addLog(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id;
    let log = assignObject(new ContactLog(), req.body);
    log.contactId = id;
    const document = await contactLogRepository.create(log);
    return res.json({
      document
    });
  }

  public static async sendMail(req: Request, res: Response, next: NextFunction) {
    const contactId = req.params.id;
    const { subject, message, attachments, cc } = req.body;
    if (!contactId || !subject || !message) {
      return res.status(400).json({ message: 'Bad Request' });
    }

    const contact: any = await contactRepository.findById(contactId);
    if (!contact || !contact.id) {
      return res.status(400).json({ message: 'Can not found contact' });
    }

    await MailService.sendEmailToContact(contact, subject, message, {});

    return res.json({ error: false });
  }

  public static async getEmailMergeTags(req: Request, res: Response, next: NextFunction) {
    let data: any = [];
    const contact = new Contact();
    for (let key in contact) {
      data.push({
        name: key,
        value: `{{${key}}}`,
        sample: `{{${key}}}`,
      });
    }
    return res.json(data);
  }
}
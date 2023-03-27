import {
  rhythmRepository,
  Rhythm,
  RhythmStep,
  rhythmStepRepository,
  rhythmContactRepository,
  RhythmContact,
  RhythmLog,
  rhythmLogRepository,
} from './../collections/rhythm';
import { Express, NextFunction, Request, Response } from 'express';
import { assignObject } from '../services/utils';
import { contactRepository } from '../collections/contact';
import MailService from '../services/MailService';
import { emailTemplateRepository } from '../collections/emailTemplate';

export default class RhythmController {
  public static async routes(app: Express) {
    app.get('/rhythms', this.getRhythms);
    app.get('/rhythms/:id', this.getRhythm);
    app.post('/rhythms', this.createRhythm);
    app.put('/rhythms/:id', this.updateRhythm);

    app.get('/rhythms/:id/steps', this.getSteps);
    app.post('/rhythms/:id/steps', this.createStep);
    app.put('/rhythm-step/:stepId', this.updateStep);

    app.get('/rhythms/:id/contacts', this.getContacts);
    app.post('/rhythms/:id/contacts', this.addContacts);
    app.delete('/rhythms/:id/contacts', this.removeContacts);
    app.delete('/rhythms/:id/related-ids', this.removeContactByIds);

    app.post('/rhythms/:id/send-mail', this.sendMail);
  }

  public static async getRhythms(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const documents = await rhythmRepository.find();
    return res.json({
      documents,
    });
  }

  public static async getRhythm(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const id = req.params.id;
    const document = await rhythmRepository.findById(id);
    // get steps
    const steps = await rhythmStepRepository
      .whereEqualTo('rhythmId', id)
      .find();
    // get logs
    const logs = await rhythmLogRepository
      .whereEqualTo('rhythmId', id)
      .find();

    return res.json({ document, steps, logs });
  }

  public static async createRhythm(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const rhythm = assignObject(new Rhythm(), req.body);
    if (!rhythm.name || !rhythm.description || !rhythm.status) {
      return res.status(400).json({ message: 'Bad Request' });
    }

    const document = await rhythmRepository.create(rhythm);
    return res.json({
      document,
    });
  }

  public static async updateRhythm(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const id = req.params.id;
    const document = await rhythmRepository.findById(id);
    if (!document) {
      return res.status(400).json({ message: 'Bad Request' });
    }

    assignObject(document, req.body);
    const newDocument = await rhythmRepository.update(document);

    return res.json({
      document: newDocument,
    });
  }

  public static async getSteps(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const id = req.params.id;
    const steps = await rhythmStepRepository
      .whereEqualTo('rhythmId', id)
      .find();
    return res.json({
      steps,
    });
  }

  public static async createStep(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const id = req.params.id;
    const document = await rhythmRepository.findById(id);
    if (!document) {
      return res.status(400).json({ message: 'Bad Request' });
    }

    const stepData = assignObject(new RhythmStep(), req.body);
    stepData.rhythmId = id;
    const step = await rhythmStepRepository.create(stepData);

    return res.json({
      document,
      step,
    });
  }

  public static async updateStep(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const stepId = req.params.stepId;
    const step = await rhythmStepRepository.findById(stepId);
    if (!step) {
      return res.status(400).json({ message: 'Bad Request' });
    }

    const data = assignObject(step, req.body);
    const updateStep = await rhythmStepRepository.update(data);

    return res.json({
      document: updateStep,
    });
  }

  public static async getContacts(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const id = req.params.id;
    let contacts = [];
    const relates = await rhythmContactRepository
      .whereEqualTo('rhythmId', id)
      .find();
    for await (let c of relates) {
      const contact = await contactRepository.findById(c.contactId);
      contacts.push(contact);
    }
    return res.json(contacts);
  }

  public static async addContacts(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const id = req.params.id;
    const contactIds = req.body.contactIds;
    for await (let contactId of contactIds) {
      const existRelate = await rhythmContactRepository
        .whereEqualTo('contactId', contactId)
        .whereEqualTo('rhythmId', id)
        .findOne();
      if (!existRelate) {
        const relate = new RhythmContact();
        relate.contactId = contactId;
        relate.rhythmId = id;
        await rhythmContactRepository.create(relate);
      }
    }
    return res.json({});
  }

  public static async removeContacts(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const id = req.params.id;
    const contactIds = req.body.contactIds;
    for await (let contactId of contactIds) {
      const relate = await rhythmContactRepository
        .whereEqualTo('rhythmId', id)
        .whereEqualTo('contactId', contactId)
        .findOne();
      if (relate) {
        await rhythmContactRepository.delete(relate.id);
      }
    }
    return res.json({});
  }

  public static async removeContactByIds(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const relatedIds = req.params.ids;
    for await (let id of relatedIds) {
      await rhythmContactRepository.delete(id);
    }
    return res.json({});
  }

  public static async sendMail(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const id = req.params.id;
    const { emailTemplateId } = req.body;
    if (!emailTemplateId) {
      return res.status(400).json({ message: 'Bad Request' });
    }

    const emailTemplate = await emailTemplateRepository.findById(
      emailTemplateId
    );

    if (!emailTemplate) {
      return res.status(404).json({ message: 'Not found email template' });
    }

    rhythmContactRepository
      .whereEqualTo('rhythmId', id)
      .find()
      .then(async (relates) => {
        // log rhythm
        const log = new RhythmLog();
        log.rhythmId = id;
        log.action = 'Send Mail';
        log.description = `Template: [${emailTemplate.id}] ${emailTemplate.name}`;
        await rhythmLogRepository.create(log);
        // add to queue mail
        for await (let relate of relates) {
          const contact = await contactRepository.findById(relate.contactId);
          if (contact) {
            await MailService.sendEmailTemplateToContact(contact, emailTemplate, {
              source: 'Rhythm',
              sourceId: id,
            });
          }
        }
      })
      .catch((err) => {
        return res.status(404).json({ message: 'Rhythm not found' });
      });

    return res.json({ error: false });
  }
}

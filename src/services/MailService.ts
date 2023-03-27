import { EmailTemplate } from './../collections/emailTemplate';
import { Contact, ContactLog, contactLogRepository } from './../collections/contact';
import { createTransport } from "nodemailer";
import { Email, emailRepository } from "../collections/email";
import { Setting, settingRepository } from './../collections/setting';
import { assignObject } from './utils';

class MailService {
  async getConfig(category: string) {
    let config: any = {};
    const settings = await settingRepository.whereEqualTo('category', category).find();
    settings.forEach(setting => {
      config[setting.name] = setting.value;
    });
    return config;
  }

  async getSMTPTransporter() {
    const config = await this.getConfig('SMTP');
    const { host, port, secure, username, password, tls } = config;
    if (!host || !port || !username || !password) {
      return null;
    }
    
    return createTransport({
      // config mail server
      host: host,
      port: port,
      secure: secure ? true : false,
      auth: {
        user: username,
        pass: password,
      },
      tls: {
        // do not fail on invalid certs
        rejectUnauthorized: tls ? true : false,
      },
    });
  }

  async getTransporter() {
    return this.getSMTPTransporter();
  }

  async sendMail(toEmail: string, subject: string, message: string, cb: any = null, options: any = {}) {
    let config;
    if (options && options.config) {
      config = options.config;
    } else {
      config = await this.getConfig('Email');
    }

    let body;
    if (options && options.data) {
      body = this.parseMailTemplate(message, options.data);
      subject = this.parseMailTemplate(subject, options.data);
    } else {
      body = message;
    }
    
    const mailOptions: any = {
      from: (options && options.fromEmail) || config.fromEmail,
      to: toEmail,
      subject: subject,
      text: options.isText ? body : null,
      html: body,
    };

    const transporter = await this.getTransporter();
    if (!transporter) {
      return null;
    }

    if (cb) {
      // info
      // {
      //   accepted: [ 'tdhungit@gmail.com' ],
      //   rejected: [],
      //   ehlo: [ 'PIPELINING', '8BITMIME', 'AUTH LOGIN PLAIN CRAM-MD5' ],
      //   envelopeTime: 335,
      //   messageTime: 126,
      //   messageSize: 7663,
      //   response: '250 Message queued as <01861979-0bcb-ea26-d7db-1f7ec5f6ee45@up5tech.com>',
      //   envelope: { from: 'jacky@up5tech.com', to: [ 'tdhungit@gmail.com' ] },
      //   messageId: '<01861979-0bcb-ea26-d7db-1f7ec5f6ee45@up5tech.com>'
      // }
      return transporter.sendMail(
        mailOptions,
        (err: any, info: any) => cb && cb(err, info)
      );
    }
    return transporter.sendMail(mailOptions);
  }

  parseMailTemplate(html: string, data: any, next: any = null) {
    let error, parsedHtml;

    if (!html) {
      error = {
        name: "RequiredValue",
        message: "You need to specify a template to parse",
      };
    }

    if (!data) {
      error = {
        name: "RequiredValue",
        message: "You need to specify the data",
      };
    }

    if (error) {
      if (next && typeof next === "function") next(error, null); // If there is a callback function, send the error
      return '';
    }

    parsedHtml = html.replace(/\{\{(.+?)\}\}/g, (_, g) => {
      // If there is a wrong data index, returns error
      if (!data[g.trim()]) {
        error = {
          name: "IndexDoesNotExists",
          message: "Index missing on data",
        };
        if (next && typeof next === "function") next(error, null);
        return '';
      }

      return data[g.trim()];
    });

    if (next && typeof next === "function") next(error, parsedHtml); // If there is a callback function, send the parsed html

    return parsedHtml;
  }

  async sendQueueMail() {
    // check status
    let status: Setting | null = await settingRepository
      .whereEqualTo('category', 'Email')
      .whereEqualTo('name', 'Queue')
      .findOne();

    if (status && status.value === 'RUNNING') {
      return false;
    }

    if (!status) {
      const setting = new Setting();
      setting.category = 'Email';
      setting.name = 'Queue';
      setting.value = 'RUNNING';
      await settingRepository.create(setting);
    } else {
      status.value = 'RUNNING';
      await settingRepository.update(status);
    }

    // get all queue mail
    const emails = await emailRepository.whereEqualTo('status', 'Queue').find();
    // send mail
    for await (let email of emails) {
      await this.sendMail(email.sendTo, email.subject, email.content, null, {
        data: email.options.data,
      });
    };

    if (!status) {
      status = await settingRepository
        .whereEqualTo('category', 'Email')
        .whereEqualTo('name', 'Queue')
        .findOne();
    }

    if (status) {
      status.value = 'Completed';
      await settingRepository.update(status);
    }

    return true;
  }

  async sendEmailTemplateToContact(contact: Contact, emailTemplate: EmailTemplate, options: any = {}) {
    const config = await this.getConfig('Email');
    // create queue mail
    const email = assignObject(new Email(), {
      subject: this.parseMailTemplate(emailTemplate.subject, contact),
      content: this.parseMailTemplate(emailTemplate.content, contact),
      sendFrom: config.fromEmail,
      sendTo: contact.email,
      source: options.source || 'Contact',
      sourceId: options.sourceId || contact.id,
      status: 'Queue',
    });

    const emailSaved = await emailRepository.create(email);

    // create contact log
    const log = assignObject(new ContactLog(), {
      contactId: contact.id,
      name: emailSaved.subject,
      message: emailSaved.content,
      attachments: [],
      status: 'Queue',
      type: 'Email',
      typeId: emailSaved.id,
    });

    await contactLogRepository.create(log);

    return emailSaved;
  }

  async sendEmailToContact(contact: Contact, subject: string, content: string, options: any = {}) {
    const config = await this.getConfig('Email');
    // create queue mail
    const email = assignObject(new Email(), {
      subject: this.parseMailTemplate(subject, contact),
      content: this.parseMailTemplate(content, contact),
      sendFrom: config.fromEmail,
      sendTo: contact.email,
      source: options.source || 'Contact',
      sourceId: options.sourceId || contact.id,
      status: 'Queue',
    });

    const emailSaved = await emailRepository.create(email);

    // create contact log
    const log = assignObject(new ContactLog(), {
      contactId: contact.id,
      name: emailSaved.subject,
      message: emailSaved.content,
      attachments: [],
      status: 'Queue',
      type: 'Email',
      typeId: emailSaved.id,
    });

    await contactLogRepository.create(log);

    return emailSaved;
  }
}

export default new MailService();

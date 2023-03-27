import { Collection, getRepository } from "fireorm";
import { initDatabase } from "../services/database";

initDatabase();

@Collection()
export class EmailTemplate {
  id: string = '';
  createdAt: Date = new Date();
  modifiedAt: Date = new Date();
  name: string = '';
  subject: string = '';
  content: string = '';
  design: any = {};
  variables: any = {};
}

export const emailTemplateRepository = getRepository(EmailTemplate);

import { Collection, getRepository } from 'fireorm';
import { initDatabase } from "../services/database";

initDatabase();

@Collection()
export class Email {
  id: string = '';
  createdAt: Date = new Date();
  subject: string = '';
  content: string = '';
  sendFrom: string = '';
  sendTo: string = '';
  source: string = '';
  sourceId: string = '';
  status: string = 'Queue';
  options: any = {};
}

export const emailRepository = getRepository(Email);

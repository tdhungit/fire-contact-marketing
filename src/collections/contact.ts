import { IsEmail } from 'class-validator';
import { Collection, getRepository } from 'fireorm';
import { initDatabase } from '../services/database';

initDatabase();

@Collection()
export class Contact {
  id: string = '';
  createdAt: Date = new Date();
  modifiedAt: Date = new Date();
  picture: string = '';
  status: string = 'Active';
  firstName: string = '';
  lastName: string = '';
  @IsEmail()
  email: string = '';
  phone: string = '';
  type: string = '';
  description: string = '';
  birthday: Date = new Date('1970-01-01');
  billingEmail: string = '';
  billingPhone: string = '';
  billingStreet1: string = '';
  billingStreet2: string = '';
  billingCity: string = '';
  billingState: string = '';
  billingCountry: string = '';
  shippingEmail: string = '';
  shippingPhone: string = '';
  shippingStreet1: string = '';
  shippingStreet2: string = '';
  shippingCity: string = '';
  shippingState: string = '';
  shippingCountry: string = '';
}

@Collection()
export class ContactLog {
  id: string = '';
  createdAt: Date = new Date();
  contactId: string = '';
  name: string = '';
  message: string = '';
  attachments: any = [];
  status: string = 'Active';
  type: string = 'Email';
  typeId: string = '';
}

export const contactRepository = getRepository(Contact);

export const contactLogRepository = getRepository(ContactLog);

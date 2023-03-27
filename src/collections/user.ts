import { Collection, getRepository } from "fireorm";
import { initDatabase } from "../services/database";

initDatabase();

@Collection()
export class User {
  id: string = '';
  createdAt: Date = new Date();
  status: string = 'Active';
  email: string = '';
  password: string = '';
  firstName: string = '';
  lastName: string = '';
  phone: string = '';
  roles: Array<string> = ['USER'];
}

export const userRepository = getRepository(User);

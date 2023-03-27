import { Collection, getRepository } from 'fireorm';
import { initDatabase } from "../services/database";

initDatabase();

@Collection()
export class Rhythm {
  id: string = '';
  createdAt: Date = new Date();
  modifiedAt: Date = new Date();
  name: string = '';
  status: string = 'Active';
  description: string = '';
  lastProcess: Date = new Date();
  emailTemplateId: string = '';
}

@Collection()
export class RhythmLog {
  id: string = '';
  createdAt: Date = new Date();
  rhythmId: string = '';
  action: string = '';
  description: string = '';
}

@Collection()
export class RhythmStep {
  id: string = '';
  rhythmId: string = '';
  createdAt: Date = new Date();
  modifiedAt: Date = new Date();
  name: string = '';
  status: string = 'Active';
  runType: string = '';
  runAt: Date = new Date();
  days: number = 0;
  hours: number = 0;
  minutes: number = 0;
  emailTemplateId: string = '';
  relateStepId: string = '';
  relateAction: string = '';
}

@Collection()
export class RhythmContact {
  id: string = '';
  rhythmId: string = '';
  contactId: string = '';
  createdAt: Date = new Date();
}

export const rhythmRepository = getRepository(Rhythm);

export const rhythmLogRepository = getRepository(RhythmLog);

export const rhythmStepRepository = getRepository(RhythmStep);

export const rhythmContactRepository = getRepository(RhythmContact);

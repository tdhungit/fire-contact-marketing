import { Collection, getRepository } from "fireorm";
import { initDatabase } from "../services/database";

initDatabase();

@Collection()
export class Setting {
  id: string;
  label: string;
  category: string;
  name: string;
  value: string;
  options: any;

  constructor() {
    this.id = '';
    this.category = '';
    this.name = '';
    this.value = '';
    this.options = {};
    this.label = '';
  }
}

export const settingRepository = getRepository(Setting);

export const allSettings: any = {
  Email: [
    {
      name: 'fromEmail',
      label: 'Email From',
    }, 
    {
      name: 'fromName',
      label: 'From Name',
    },
  ],
  SMTP: [
    {
      name: 'host',
      label: 'Host',
    },
    {
      name: 'port',
      label: 'Port',
    },
    {
      name: 'secure',
      label: 'Secure',
    },
    {
      name: 'username',
      label: 'Username',
    },
    {
      name: 'password',
      label: 'Password',
    },
    {
      name: 'tls',
      label: 'tls',
    },
  ],
};

export function settingsByKey() {
  let settings: any = {};
  for (let category in allSettings) {
    let categorySettings: any = allSettings[category];
    categorySettings.forEach((setting: any) => {
      if (!settings[category]) {
        settings[category] = {};
      }
      settings[category][setting.name] = setting.label;
    });
  }
  return settings;
}

export async function getSettings(categories: string[]) {
  const data: any = {};
  for await (let category of categories) {
    const settings = await settingRepository.whereEqualTo('category', category).find();
    settings.forEach((setting: any) => {
      if (!data[category]) {
        data[category] = {};
      }
      data[category][setting.name] = setting.value;
    });
  }
  return data;
}

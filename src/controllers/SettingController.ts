import { settingRepository, allSettings, settingsByKey, Setting } from './../collections/setting';
import { Express, NextFunction, Request, Response } from 'express';

export default class SettingController {
  public static routes(app: Express) {
    app.post('/settings', this.saveMultipleSettings);
    app.get('/settings/:category', this.getSettings);
    app.post('/settings/:category', this.saveSettings);
  }

  public static async getSettings(req: Request, res: Response, next: NextFunction) {
    const category = req.params.category;
    const documents = await settingRepository.whereEqualTo('category', category).find();
    return res.json({ documents });
  }

  public static async saveSettings(req: Request, res: Response, next: NextFunction) {
    const category = req.params.category;
    if (!allSettings[category]) {
      return res.status(400).json({ message: 'Bad Request' });
    }

    for await (let item of allSettings[category]) {
      // get if exist
      const setting: any = settingRepository
        .whereEqualTo('category', category)
        .whereEqualTo('name', item.name)
        .findOne();

      if (!setting) {
        const newSetting = new Setting();
        newSetting.category = category;
        newSetting.name = item.name;
        newSetting.label = item.label;
        newSetting.value = req.body.value;
        await settingRepository.create(newSetting);
      } else {
        setting.value = req.body.value;
        await settingRepository.update(setting);
      }
    }

    const documents = await settingRepository.whereEqualTo('category', category).find();
    return res.json({ documents });
  }

  public static async saveMultipleSettings(req: Request, res: Response, next: NextFunction) {
    for await (let item of req.body) {
      if (
        item.category 
        && item.name 
        && settingsByKey()[item.category]
        && settingsByKey()[item.category][item.name]
      ) {
        const document = await settingRepository
          .whereEqualTo('category', item.category)
          .whereEqualTo('name', item.name)
          .findOne();
        if (!document) {
          const setting = new Setting();
          setting.category = item.category;
          setting.name = item.name;
          setting.value = item.value;
          await settingRepository.create(setting);
        } else {
          document.value = item.value;
          await settingRepository.update(document);
        }
      }
    };
    return res.json({ error: false });
  }
}
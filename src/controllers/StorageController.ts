import { firebaseConfig } from './../services/database';
import { Express, NextFunction, Request, Response } from "express";
import { initDatabase } from "../services/database";
import Multer from "multer";
import FirebaseStorage from "multer-firebase-storage";

const { instance, storage } = initDatabase();
const multer = Multer({
  storage: FirebaseStorage({ bucketName: firebaseConfig.bucketName }, instance)
});

export default class StorageController {
  public static routes(app: Express) {
    app.post('/upload', multer.single('file'), this.upload);
    app.get('/download-url', this.getDownloadUrl);
  }

  public static async upload(req: Request, res: Response, next: NextFunction) {
    return res.json(req.file);
  }

  public static async getDownloadUrl(req: Request, res: Response, next: NextFunction) {
    const uri: any = req.query.uri;
    if (!uri) {
      return res.status(400).json({ message: 'Bad Request' });
    }

    const file = storage.bucket().file(uri);

    const [ url ] = await file.getSignedUrl({
      action: 'read',
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    return res.json({ url });
  }
}

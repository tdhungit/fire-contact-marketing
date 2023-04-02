import * as admin from "firebase-admin";
import * as fireorm from "fireorm";
import { storage } from "firebase-admin";
import creds from "../config/firestore.creds.json";

export const firebaseConfig = {
  bucketName: 'gs://firecontactmarketing.appspot.com',
};

export function initDatabase(): { storage: storage.Storage, instance: admin.app.App } {
  if (admin.apps.length > 0) {
    return {
      storage: admin.storage(),
      instance: admin.app(),
    };
  }

  const serviceAccount: any = creds;

  const instance = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
    storageBucket: firebaseConfig.bucketName,
  });

  const firestore = admin.firestore();
  fireorm.initialize(firestore);

  return {
    storage: admin.storage(),
    instance: instance,
  };
}

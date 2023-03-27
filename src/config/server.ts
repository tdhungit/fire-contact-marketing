import { Scheduler } from './../schedulers/index';
import { isAuth } from './../middlewares/auth.middleware';
import { Express, Request, Response } from "express";
import AuthController from "../controllers/AuthController";
import ContactController from "../controllers/ContactController";
import UserController from "../controllers/UserController";
import SettingController from '../controllers/SettingController';
import EmailTemplateController from '../controllers/EmailTemplateController';
import RhythmController from '../controllers/RhythmController';
import StorageController from '../controllers/StorageController';

class FireContactMarketingServer {
  start(app: Express) {
    // authenticate
    app.use(isAuth);
    // config routes
    this.routes(app);
    // schedule jobs
    const scheduler = new Scheduler();
    scheduler.run();
    // run server
    const port = process.env.PORT || 5055;
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}`);
    });
  }

  routes(app: Express) {
    // hello world
    app.get('/', (req: Request, res: Response) => {
      res.json({
        message: 'Hello Fire Contact Marketing Open Source',
      });
    });
    // public
    app.get('/public', (req: Request, res: Response) => {
      res.json({
        message: 'Hello Fire Contact Marketing Open Source',
      });
    });

    AuthController.routes(app);
    UserController.routes(app);
    SettingController.routes(app);
    StorageController.routes(app);
    ContactController.routes(app);
    EmailTemplateController.routes(app);
    RhythmController.routes(app);
  }
}

export default new FireContactMarketingServer();

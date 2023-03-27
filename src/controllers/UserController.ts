import { NextFunction, Request, Response, Express } from "express";
import { Md5 } from "ts-md5";
import { User, userRepository } from "../collections/user";
import { assignObject } from "../services/utils";

export default class UserController {
  public static routes(app: Express) {
    if (process.env.ENV === 'dev') {
      app.post('/users/init', this.initUser);
    }
    
    app.get('/current-user', this.currentUser);

    app.get('/users', this.getUsers);
    app.post('/users', this.createUser);
    app.get('/users/:id', this.getUser);
    app.put('/users/:id', this.updateUser);
  }

  public static async initUser(req: Request, res: Response, next: NextFunction) {
    const documents = userRepository.find();
    const length = Object.entries(documents).length;
    if (length === 0) {
      const user = new User();
      user.email = 'admin@abc.com';
      user.firstName = 'Admin';
      user.lastName = 'FireContactMarketing';
      user.phone = '0909090909';
      user.roles = ['ADMIN'];

      let password = new Md5();
      password.appendStr('admin');
      user.password = password.end()?.toString() || '';
      
      const document = await userRepository.create(user);
      return res.json(document);
    }
    return res.json({ message: 'Bad Request' });
  }

  public static async currentUser(req: Request, res: Response, next: NextFunction) {
    return res.json(req.user);
  }

  public static async getUsers(req: Request, res: Response, next: NextFunction) {
    const documents = await userRepository.find();
    return res.json({
      documents,
    });
  }

  public static async createUser(req: Request, res: Response, next: NextFunction) {
    const document = assignObject(new User(), req.body);

    if (!document.email || !document.password) {
      return res.status(400).json({ message: 'Bad Request' });
    }

    // check exist email
    const duplicate = await userRepository.whereEqualTo('email', document.email).findOne();
    if (duplicate) {
      return res.json({
        error: true,
        message: 'Exist email',
        document: duplicate,
      });
    }

    // create
    const newDocument = await userRepository.create(document);
    return res.json({
      document: newDocument
    });
  }

  public static async getUser(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id;
    const document = await userRepository.findById(id);
    return res.json({
      document
    });
  }

  public static async updateUser(req: Request, res: Response, next: NextFunction) {
    const id = req.params.id;
    const document = await userRepository.findById(id);
    if (!document) {
      return res.status(400).json({ message: 'Bad Request' });
    }

    assignObject(document, req.body);
    const newDocument = await userRepository.update(document);

    return res.json({
      document: newDocument
    });
  }
}

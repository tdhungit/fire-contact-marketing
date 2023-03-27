import { Express } from "express";
import { userRepository } from "./../collections/user";
import { Md5 } from "ts-md5";
import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";

export default class AuthController {
  public static routes(app: Express) {
    app.post('/login', this.login);
  }

  public static async login(req: Request, res: Response, next: NextFunction) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Bad Request" });
    }

    const hashPassword = new Md5();
    hashPassword.appendStr(password);
    const hash = hashPassword.end();

    if (!hash) {
      return res.status(400).json({ message: "Bad Request" });
    }

    const user = await userRepository
      .whereEqualTo("email", email)
      .whereEqualTo("password", hash.toString())
      .findOne();

    if (user && process.env.TOKEN_SECRET) {
      const expiresIn = 60 * 60;
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.TOKEN_SECRET,
        { expiresIn: expiresIn }
      );
      return res.json({ token, expiresIn });
    }

    return res.status(401).json({ message: 'Authorized' });
  }
}

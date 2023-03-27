import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { userRepository } from "../collections/user";
import { SystemConfig } from "../config";

export const isAuth = async (req: Request, res: Response, next: NextFunction) => {
  // allow public access
  if (SystemConfig.publicRoutes.includes(req.path)) {
    return next();
  }

	const authHeader = req.headers['authorization'];
	if (!authHeader) {
		return res.status(401).json({ message: 'Authorized' });
	}

  const token = authHeader && authHeader.split(' ')[1];
  try {
    let email;
    if (process.env.ENV === 'dev' && process.env.DEV_TOKEN === token) {
      email = process.env.DEV_ADMIN_USER || 'admin@abc.com';
    } else {
      if (!process.env.TOKEN_SECRET) {
        return res
          .status(401)
          .json({ message: 'Authorized' });
      }

      const verified: any = jwt.verify(
        token,
        process.env.TOKEN_SECRET
      );
  
      if (!verified) {
        return res
          .status(401)
          .json({ message: 'Authorized' });
      }
  
      email = verified.email;
    }

    const user = await userRepository.whereEqualTo('email', email).findOne();
    req.user = { ...user, password: '' };

    return next();
  } catch (err) {
    return res
      .status(401)
      .json({ message: 'Authorized' });
  }
};
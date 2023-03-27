import * as dotenv from "dotenv";
dotenv.config();

import express, { Express, NextFunction, Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";

import FireContactMarketingServer from "./config/server";

const app: Express = express();

app.use(cors({
  origin: '*',
  optionsSuccessStatus: 200,
  allowedHeaders: ['Authorization', 'Content-Type'],
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(function (err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err.stack);
  return res.set(err.headers).status(err.status).json({ message: err.message });
});

FireContactMarketingServer.start(app);

import { scheduleJob } from "node-schedule";
import MailService from "../services/MailService";

export class Scheduler {
  run() {
    if (process.env.SCHEDULE_CRON_JOB) {
      scheduleJob(process.env.SCHEDULE_CRON_JOB, this.sendQueueMail);
    }
  }

  sendQueueMail() {
    console.log('Send Queue Mail');
    MailService.sendQueueMail();
  }
}


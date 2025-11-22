// src/app.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getRoot() {
    return {
      status: 'ok',
      message: 'Backend NestJS listo para el hackatón 🚀',
      env: process.env.NODE_ENV || 'unknown',
    };
  }

  getHealth() {
    return {
      status: 'ok',
      db: 'ok', // más adelante podés hacer un check real a la DB
      timestamp: new Date().toISOString(),
    };
  }
}

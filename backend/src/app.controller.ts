// src/app.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller() // raíz "/"
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getRoot() {
    return this.appService.getRoot();
  }

  @Get('health')
  getHealth() {
    return this.appService.getHealth();
  }
}

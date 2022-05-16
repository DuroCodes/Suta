import { FastifyInstance, RouteOptions } from 'fastify';

type Done = () => void;

interface RouteType {
  prefix: string;
  run: (fastify: FastifyInstance, options: RouteOptions, done: Done) => void;
}

export class Route implements RouteType {
  public prefix: string;

  public run: (fastify: FastifyInstance, options: RouteOptions, done: Done) => void;

  constructor(route: RouteType) {
    this.prefix = route.prefix;
    this.run = route.run;
    this.run = this.run.bind(this);
  }
}

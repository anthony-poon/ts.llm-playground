import env from '@env';
import ExpressHttp from './express';

const http = new ExpressHttp(env);

export default http;

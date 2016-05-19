import Koa from 'koa';
import Koa_router from 'koa-router';
import Koa_logger from 'koa-logger';
import Koa_favicon from 'koa-favicon';
import Koa_convert from 'koa-convert';
import Koa_json from 'koa-json';
import Koa_body_parser from 'koa-bodyparser';
import Koa_Nunjucks from 'koa-nunjucks-2';
import {system_config} from './config.js';
import {query} from './api/db/mysql.js';
import path from 'path';
import serve from 'koa-static';

const app = new Koa();
const router = new Koa_router();
const body_parser = new Koa_body_parser();

app
    .use(Koa_convert(body_parser))
    .use(Koa_convert(Koa_json()))
    .use(Koa_convert(Koa_logger()))
    .use(Koa_convert(Koa_favicon(path.join(__dirname, '../app/assets/img/favicon.ico'))))
    .use(Koa_convert(serve(path.join(__dirname, '../app'))))
    .use((ctx, next) => {
        const start = new Date();
        return next().then(() => {
            const ms = new Date() - start;
            console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
        });
    })
    .use(Koa_Nunjucks({
        ext: 'html',
        path: path.join(__dirname, 'app/template'),
        nunjucksConfig: {
            autoescape: true
        }
    }));

router
    .get('/', (ctx) => {
        return query("SELECT * FROM `xuan`").then((result) => {
            if (result.length == 0) {
                ctx.throw(404, '未找该页面!');
            } else {
                result = {
                    result: result,
                    sql: "SELECT * FROM `xuan`"
                };
                ctx.render('index', result);
            }
        });
    })
    .post('/', (ctx) => {
        return query(ctx.request.body.sql).then((result) => {
            if (result.length == 0) {
                ctx.throw(404, '未找该页面或没有任何内容!');
            } else {
                result = {
                    result: result,
                    sql: ctx.request.body.sql
                };
                ctx.render('index', result);
            }
        });
    });

app
    .use(router.routes())
    .use(router.allowedMethods())
    .listen(system_config.HTTP_server_port);

console.log("Now start HTTP server on port " + system_config.HTTP_server_port + "...");

export default app;
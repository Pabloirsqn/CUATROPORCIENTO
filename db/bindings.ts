import {env} from 'cloudflare:workers';
export function bindings(){if(!env.DB||!env.BUCKET)throw Error('El almacenamiento no está disponible.');return {db:env.DB,bucket:env.BUCKET};}

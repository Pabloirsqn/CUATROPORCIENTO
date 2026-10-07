import {integer,sqliteTable,text} from 'drizzle-orm/sqlite-core';
export const demoState=sqliteTable('demo_state',{id:text('id').primaryKey(),data:text('data').notNull(),version:integer('version').notNull().default(0),updatedAt:text('updated_at').notNull()});
export const photoUploads=sqliteTable('photo_uploads',{id:text('id').primaryKey(),actorId:text('actor_id').notNull(),objectKey:text('object_key').notNull(),contentType:text('content_type').notNull(),bytes:integer('bytes').notNull(),createdAt:text('created_at').notNull()});
export const membershipState=sqliteTable('membership_state',{id:text('id').primaryKey(),data:text('data').notNull(),version:integer('version').notNull().default(0),updatedAt:text('updated_at').notNull()});

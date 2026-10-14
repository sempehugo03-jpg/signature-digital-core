import {sql} from 'drizzle-orm';
import {sqliteTable,integer,text,blob,primaryKey,check} from 'drizzle-orm/sqlite-core';
export const state=sqliteTable('fs_data_state',{singleton:integer('singleton').primaryKey(),bindingJson:text('binding_json').notNull(),currentRelease:text('current_release').notNull(),revision:integer('revision').notNull()},table=>[check('fs_data_singleton',sql`${table.singleton}=1`)]);
export const artifacts=sqliteTable('fs_data_artifacts',{sha256:text('sha256').primaryKey(),html:text('html').notNull()});
export const releases=sqliteTable('fs_data_releases',{releaseRef:text('release_ref').primaryKey(),sha256:text('sha256').notNull(),generation:integer('generation').notNull(),receiptJson:text('receipt_json').notNull()});
export const commands=sqliteTable('fs_data_commands',{commandKey:text('command_key').primaryKey(),payloadHash:text('payload_hash').notNull(),state:text('state').notNull(),receiptJson:text('receipt_json')});
export const nonces=sqliteTable('fs_data_nonces',{nonce:text('nonce').primaryKey(),expiresAt:integer('expires_at').notNull()});
export const assets=sqliteTable('fs_data_assets',{sha256:text('sha256').primaryKey(),byteSize:integer('byte_size').notNull(),partCount:integer('part_count').notNull(),state:text('state').notNull()});
export const assetParts=sqliteTable('fs_data_asset_parts',{sha256:text('sha256').notNull(),part:integer('part').notNull(),chunkSha256:text('chunk_sha256').notNull(),bytes:blob('bytes',{mode:'buffer'}).notNull()},table=>[primaryKey({columns:[table.sha256,table.part]})]);

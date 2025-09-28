import { pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';

/**
 * 用户数据模型
 * 
 * @description 定义用户表的数据结构，使用Drizzle ORM
 * 包含用户的基本信息和权限控制字段
 */
export const users = pgTable('users', {
  /**
   * 用户ID - 主键
   * 自增整数，作为用户的唯一标识符
   */
  id: serial('id').primaryKey(),

  /**
   * 用户姓名
   * 必填字段，最大长度255字符
   */
  name: varchar('name', { length: 255 }).notNull(),

  /**
   * 用户邮箱
   * 必填字段，唯一约束，最大长度255字符
   * 用作登录标识符
   */
  email: varchar('email', { length: 255 }).notNull().unique(),

  /**
   * 密码哈希值
   * 必填字段，存储bcrypt加密后的密码
   * 最大长度255字符（足够存储bcrypt哈希）
   */
  password: varchar('password', { length: 255 }).notNull(),

  /**
   * 用户角色
   * 必填字段，默认为'user'
   * 可选值：'user', 'admin'
   */
  role: varchar('role', { length: 40 }).notNull().default('user'),

  /**
   * 创建时间
   * 自动设置为当前时间，不可为空
   */
  created_at: timestamp('created_at').defaultNow().notNull(),

  /**
   * 更新时间
   * 自动设置为当前时间，每次更新时需要手动更新
   */
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

/**
 * 用户角色枚举
 * 
 * @description 定义系统中可用的用户角色
 */
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
} as const;

/**
 * 用户状态枚举 (可选，未在当前表结构中使用)
 * 
 * @description 定义用户账户的可能状态
 */
export const USER_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending'
} as const;

/* 
模型使用示例:

import { users, USER_ROLES } from './user.model.js';
import { db } from '../config/database.js';
import { eq } from 'drizzle-orm';

// 创建新用户
const newUser = await db.insert(users).values({
  name: 'John Doe',
  email: 'john@example.com',
  password: hashedPassword,
  role: USER_ROLES.USER
}).returning();

// 查询用户
const user = await db.select()
  .from(users)
  .where(eq(users.email, 'john@example.com'))
  .limit(1);

// 更新用户
const updatedUser = await db.update(users)
  .set({ 
    name: 'Jane Doe',
    updated_at: new Date()
  })
  .where(eq(users.id, userId))
  .returning();

// 删除用户
const deletedUser = await db.delete(users)
  .where(eq(users.id, userId))
  .returning();

数据库迁移 SQL (使用 Drizzle Kit 生成):

CREATE TABLE "users" (
  "id" serial PRIMARY KEY,
  "name" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "password" varchar(255) NOT NULL,
  "role" varchar(40) NOT NULL DEFAULT 'user',
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX ON "users" ("email");
CREATE INDEX ON "users" ("role");
CREATE INDEX ON "users" ("created_at");

*/
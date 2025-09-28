import { z } from 'zod';

/**
 * 用户ID验证规则
 * 
 * @description 验证URL路径参数中的用户ID格式
 */
export const userIdSchema = z.object({
  /**
   * 用户ID验证
   * - 必须是字符串格式的数字
   * - 转换为数字类型
   * - 必须是正整数
   */
  id: z
    .string({
      required_error: '用户ID是必填项',
      invalid_type_error: '用户ID必须是字符串'
    })
    .regex(/^\d+$/, 'ID必须是有效的数字')
    .transform(Number)
    .refine(val => val > 0, 'ID必须是正整数')
});

/**
 * 更新用户信息验证规则
 * 
 * @description 验证用户信息更新请求的数据格式
 */
export const updateUserSchema = z
  .object({
    /**
     * 用户姓名验证 (可选)
     * - 最小长度: 2个字符
     * - 最大长度: 255个字符
     * - 自动去除前后空格
     */
    name: z
      .string({
        invalid_type_error: '用户姓名必须是字符串'
      })
      .min(2, '用户姓名至少需要2个字符')
      .max(255, '用户姓名不能超过255个字符')
      .trim()
      .optional(),

    /**
     * 邮箱验证 (可选)
     * - 必须是有效的邮箱格式
     * - 最大长度: 255个字符
     * - 自动转换为小写
     * - 自动去除前后空格
     */
    email: z
      .string({
        invalid_type_error: '邮箱必须是字符串'
      })
      .email('请输入有效的邮箱地址')
      .max(255, '邮箱地址不能超过255个字符')
      .toLowerCase()
      .trim()
      .optional(),

    /**
     * 用户角色验证 (可选)
     * - 只允许 'user' 或 'admin'
     * - 仅管理员可以在控制器中修改此字段
     */
    role: z
      .enum(['user', 'admin'], {
        errorMap: () => ({ message: '用户角色只能是 user 或 admin' })
      })
      .optional()
  })
  .refine(
    (data) => {
      // 确保至少提供一个字段进行更新
      return Object.keys(data).length > 0;
    },
    {
      message: '至少需要提供一个字段进行更新',
      path: [] // 错误应用于整个对象
    }
  );

/**
 * 用户搜索/过滤参数验证规则 (可选功能)
 * 
 * @description 验证用户列表查询参数
 */
export const userQuerySchema = z.object({
  /**
   * 分页参数 - 页码
   */
  page: z
    .string()
    .regex(/^\d+$/, '页码必须是数字')
    .transform(Number)
    .refine(val => val >= 1, '页码必须大于等于1')
    .default('1'),

  /**
   * 分页参数 - 每页数量
   */
  limit: z
    .string()
    .regex(/^\d+$/, '每页数量必须是数字')
    .transform(Number)
    .refine(val => val >= 1 && val <= 100, '每页数量必须在1-100之间')
    .default('10'),

  /**
   * 搜索关键词
   */
  search: z
    .string()
    .max(255, '搜索关键词不能超过255个字符')
    .trim()
    .optional(),

  /**
   * 角色过滤
   */
  role: z
    .enum(['user', 'admin'])
    .optional(),

  /**
   * 排序字段
   */
  sortBy: z
    .enum(['id', 'name', 'email', 'created_at', 'updated_at'])
    .default('created_at'),

  /**
   * 排序方向
   */
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc')
});

/**
 * 批量用户操作验证规则 (可选功能)
 * 
 * @description 验证批量用户操作的请求数据
 */
export const batchUserOperationSchema = z.object({
  /**
   * 用户ID列表
   */
  userIds: z
    .array(
      z.number().int().positive('用户ID必须是正整数'),
      {
        required_error: '用户ID列表是必填项',
        invalid_type_error: '用户ID列表必须是数组'
      }
    )
    .min(1, '至少需要选择一个用户')
    .max(50, '单次最多只能操作50个用户'),

  /**
   * 操作类型
   */
  operation: z.enum(['delete', 'updateRole'], {
    errorMap: () => ({ message: '操作类型只能是 delete 或 updateRole' })
  }),

  /**
   * 新角色 (仅在updateRole操作时需要)
   */
  newRole: z
    .enum(['user', 'admin'])
    .optional()
}).refine(
  (data) => {
    // 如果操作是updateRole，必须提供newRole
    if (data.operation === 'updateRole' && !data.newRole) {
      return false;
    }
    return true;
  },
  {
    message: '更新角色操作时必须指定新角色',
    path: ['newRole']
  }
);

/**
 * 用户密码重置验证规则 (可选功能)
 * 
 * @description 管理员重置用户密码的验证规则
 */
export const resetUserPasswordSchema = z.object({
  /**
   * 用户ID
   */
  userId: z
    .number()
    .int()
    .positive('用户ID必须是正整数'),

  /**
   * 新密码
   */
  newPassword: z
    .string({
      required_error: '新密码是必填项'
    })
    .min(6, '新密码至少需要6个字符')
    .max(128, '新密码不能超过128个字符'),

  /**
   * 是否要求用户下次登录时修改密码
   */
  requirePasswordChange: z
    .boolean()
    .default(true)
});

/* 
使用示例:

在控制器中使用这些验证规则:

import {
  userIdSchema,
  updateUserSchema,
  userQuerySchema
} from './users.validation.js';

// 验证用户ID
export const fetchUserById = async (req, res, next) => {
  try {
    const validationResult = userIdSchema.safeParse({ id: req.params.id });
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error)
      });
    }
    
    const { id } = validationResult.data;
    // 继续处理...
  } catch (error) {
    next(error);
  }
};

// 验证更新数据
export const updateUserById = async (req, res, next) => {
  try {
    const updateValidation = updateUserSchema.safeParse(req.body);
    
    if (!updateValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(updateValidation.error)
      });
    }
    
    const updates = updateValidation.data;
    // 继续处理...
  } catch (error) {
    next(error);
  }
};

// 验证查询参数
export const fetchUsersWithFilter = async (req, res, next) => {
  try {
    const queryValidation = userQuerySchema.safeParse(req.query);
    
    if (!queryValidation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(queryValidation.error)
      });
    }
    
    const { page, limit, search, role, sortBy, sortOrder } = queryValidation.data;
    // 继续处理...
  } catch (error) {
    next(error);
  }
};

常见验证错误响应:

{
  "success": false,
  "error": "Validation failed",
  "message": "用户ID格式无效",
  "details": "ID必须是有效的数字"
}

{
  "success": false,
  "error": "Validation failed",
  "message": "更新数据格式无效", 
  "details": "至少需要提供一个字段进行更新"
}

*/
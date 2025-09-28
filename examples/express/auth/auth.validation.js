import { z } from 'zod';

/**
 * 用户注册数据验证规则
 * 
 * @description 定义用户注册时的数据验证规则，确保数据格式正确和安全性
 */
export const signupSchema = z.object({
  /**
   * 用户姓名验证
   * - 最小长度: 2个字符
   * - 最大长度: 255个字符  
   * - 自动去除前后空格
   */
  name: z
    .string({
      required_error: '用户姓名是必填项',
      invalid_type_error: '用户姓名必须是字符串'
    })
    .min(2, '用户姓名至少需要2个字符')
    .max(255, '用户姓名不能超过255个字符')
    .trim(),

  /**
   * 邮箱验证
   * - 必须是有效的邮箱格式
   * - 最大长度: 255个字符
   * - 自动转换为小写
   * - 自动去除前后空格
   */
  email: z
    .string({
      required_error: '邮箱是必填项',
      invalid_type_error: '邮箱必须是字符串'
    })
    .email('请输入有效的邮箱地址')
    .max(255, '邮箱地址不能超过255个字符')
    .toLowerCase()
    .trim(),

  /**
   * 密码验证
   * - 最小长度: 6个字符
   * - 最大长度: 128个字符
   * - 包含字母数字组合 (可根据需要调整)
   */
  password: z
    .string({
      required_error: '密码是必填项',
      invalid_type_error: '密码必须是字符串'
    })
    .min(6, '密码至少需要6个字符')
    .max(128, '密码不能超过128个字符')
    // 可选: 添加密码强度验证
    // .regex(
    //   /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    //   '密码必须包含至少一个大写字母、一个小写字母和一个数字'
    // ),

  /**
   * 用户角色验证
   * - 只允许 'user' 或 'admin'
   * - 默认值: 'user'
   */
  role: z
    .enum(['user', 'admin'], {
      errorMap: () => ({ message: '用户角色只能是 user 或 admin' })
    })
    .default('user')
});

/**
 * 用户登录数据验证规则
 * 
 * @description 定义用户登录时的数据验证规则
 */
export const signinSchema = z.object({
  /**
   * 邮箱验证 (登录用)
   * - 必须是有效的邮箱格式
   * - 自动转换为小写
   * - 自动去除前后空格
   */
  email: z
    .string({
      required_error: '邮箱是必填项',
      invalid_type_error: '邮箱必须是字符串'
    })
    .email('请输入有效的邮箱地址')
    .toLowerCase()
    .trim(),

  /**
   * 密码验证 (登录用)
   * - 最小长度: 1个字符 (登录时不需要太严格的长度验证)
   * - 最大长度: 128个字符
   */
  password: z
    .string({
      required_error: '密码是必填项',
      invalid_type_error: '密码必须是字符串'
    })
    .min(1, '密码不能为空')
    .max(128, '密码不能超过128个字符')
});

/**
 * 密码重置请求验证规则 (可选功能)
 * 
 * @description 用于忘记密码功能的邮箱验证
 */
export const forgotPasswordSchema = z.object({
  email: z
    .string({
      required_error: '邮箱是必填项'
    })
    .email('请输入有效的邮箱地址')
    .toLowerCase()
    .trim()
});

/**
 * 密码重置验证规则 (可选功能)
 * 
 * @description 用于重置密码功能的验证
 */
export const resetPasswordSchema = z.object({
  /**
   * 重置令牌
   */
  token: z
    .string({
      required_error: '重置令牌是必填项'
    })
    .min(1, '重置令牌不能为空'),

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
   * 确认新密码
   */
  confirmPassword: z
    .string({
      required_error: '确认密码是必填项'
    })
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: '两次输入的密码不匹配',
    path: ['confirmPassword']
  }
);

/**
 * 修改密码验证规则 (可选功能)
 * 
 * @description 用于已登录用户修改密码的验证
 */
export const changePasswordSchema = z.object({
  /**
   * 当前密码
   */
  currentPassword: z
    .string({
      required_error: '当前密码是必填项'
    })
    .min(1, '当前密码不能为空'),

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
   * 确认新密码
   */
  confirmPassword: z
    .string({
      required_error: '确认密码是必填项'
    })
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: '两次输入的密码不匹配',
    path: ['confirmPassword']
  }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: '新密码不能与当前密码相同',
    path: ['newPassword']
  }
);

/* 
使用示例:

在控制器中使用这些验证规则:

import { signupSchema, signinSchema } from './auth.validation.js';

export const signup = async (req, res, next) => {
  try {
    // 验证请求数据
    const validationResult = signupSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatValidationError(validationResult.error)
      });
    }
    
    // 使用验证后的数据
    const { name, email, password, role } = validationResult.data;
    
    // 继续业务逻辑...
  } catch (error) {
    next(error);
  }
};

自定义验证示例:

// 密码强度验证
const strongPasswordSchema = z
  .string()
  .min(8, '密码至少需要8个字符')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    '密码必须包含至少一个大写字母、小写字母、数字和特殊字符'
  );

// 邮箱域名限制
const corporateEmailSchema = z
  .string()
  .email()
  .refine(
    (email) => email.endsWith('@company.com'),
    '只允许使用公司邮箱注册'
  );

*/
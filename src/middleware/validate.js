import { z } from 'zod';
import { fromZodError } from 'zod-validation-error';

// Common validation schemas
const schemas = {
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be less than 100 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]).{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  url: z.string().url('Invalid URL').or(z.literal('')),
  phone: z
    .string()
    .regex(/^[0-9]{10}$/, 'Phone number must be 10 digits')
    .or(z.literal('')),
  positiveInt: z.number().int().positive(),
  nonEmptyString: (field) => z.string().min(1, `${field} is required`).trim(),
  file: (options = {}) => {
    const { 
      maxSize = 10 * 1024 * 1024, // 10MB default
      allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
      fieldName = 'file'
    } = options;
    
    return z
      .custom((value) => value && value.size <= maxSize, {
        message: `${fieldName} must be less than ${maxSize / (1024 * 1024)}MB`,
      })
      .refine(
        (value) => allowedTypes.includes(value?.type),
        `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
      );
  },
};

// Request validation middleware
const validate = (schema) => {
  return async (req, res, next) => {
    try {
      // Parse and validate request data
      const data = {
        ...req.body,
        ...req.query,
        ...req.params,
        ...(req.file && { file: req.file }),
        ...(req.files && { files: req.files }),
      };

      // Validate against schema
      const validatedData = await schema.safeParseAsync(data);

      if (!validatedData.success) {
        const error = fromZodError(validatedData.error, {
          prefix: 'Validation Error',
          prefixSeparator: '\n',
        });
        
        return res.status(400).json({
          error: 'Validation Error',
          message: error.message,
          details: validatedData.error.format(),
        });
      }

      // Replace request data with validated data
      req.validatedData = validatedData.data;
      next();
    } catch (error) {
      console.error('Validation error:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred during validation',
      });
    }
  };
};

// Export schemas and validation middleware
export { schemas, validate };

/* eslint-disable consistent-return */
/* eslint-disable import/prefer-default-export */
import { Request, Response, NextFunction, RequestHandler } from 'express';

export type ValidationRule = string[] | { oneOf: string[] };
export type ValidationRules = {
  [key: string]: ValidationRule;
};

export interface ValidationOptions {
  body?: { [key: string]: ValidationRule };
  query?: { [key: string]: ValidationRule };
  params?: { [key: string]: ValidationRule };
}

export const validateRequest = (options: ValidationOptions): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    const validateField = (value: any, rules: ValidationRule, fieldName: string) => {
      if (Array.isArray(rules)) {
        rules.forEach((rule) => {
          if (rule === 'required' && !value) {
            errors.push(`${fieldName} is required`);
          }
          if (rule === 'string' && value && typeof value !== 'string') {
            errors.push(`${fieldName} must be a string`);
          }
          if (rule.startsWith('oneOf:')) {
            const allowedValues = rule.split(':')[1].split(',');
            if (value && !allowedValues.includes(value)) {
              errors.push(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
            }
          }
        });
      } else if ('oneOf' in rules) {
        if (value && !rules.oneOf.includes(value)) {
          errors.push(`${fieldName} must be one of: ${rules.oneOf.join(', ')}`);
        }
      }
    };

    const validateObject = (obj: any, rules: { [key: string]: ValidationRule }, prefix: string) => {
      Object.entries(rules).forEach(([key, rule]) => {
        validateField(obj?.[key], rule, `${prefix}${key}`);
      });
    };

    if (options.body) {
      validateObject(req.body, options.body, '');
    }
    if (options.query) {
      validateObject(req.query, options.query, '');
    }
    if (options.params) {
      validateObject(req.params, options.params, '');
    }

    if (errors.length > 0) {
      res.status(400).json({ errors });
      return;
    }

    next();
  };
};

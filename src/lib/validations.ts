import { z } from 'zod';

export const contactFormSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),
  email: z.string()
    .email('Email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères')
    .trim(),
  phone: z.string()
    .regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,8}$/, 'Numéro de téléphone invalide')
    .min(8, 'Le numéro doit contenir au moins 8 chiffres')
    .max(20, 'Le numéro ne peut pas dépasser 20 caractères')
    .trim(),
  subject: z.string()
    .min(5, 'Le sujet doit contenir au moins 5 caractères')
    .max(200, 'Le sujet ne peut pas dépasser 200 caractères')
    .trim()
    .optional(),
  message: z.string()
    .min(10, 'Le message doit contenir au moins 10 caractères')
    .max(2000, 'Le message ne peut pas dépasser 2000 caractères')
    .trim()
});

export const companyRequestSchema = z.object({
  contact_name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),
  email: z.string()
    .email('Email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères')
    .trim(),
  phone: z.string()
    .regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,8}$/, 'Numéro de téléphone invalide')
    .min(8, 'Le numéro doit contenir au moins 8 chiffres')
    .max(20, 'Le numéro ne peut pas dépasser 20 caractères')
    .trim(),
  structure_type: z.string()
    .min(2, 'Le type de structure est requis'),
  company_name: z.string()
    .min(2, 'Le nom de l\'entreprise doit contenir au moins 2 caractères')
    .max(200, 'Le nom ne peut pas dépasser 200 caractères')
    .trim()
    .optional(),
  region: z.string()
    .min(2, 'La région est requise'),
  city: z.string()
    .max(100, 'La ville ne peut pas dépasser 100 caractères')
    .trim()
    .optional(),
  address: z.string()
    .min(5, 'L\'adresse doit contenir au moins 5 caractères')
    .max(500, 'L\'adresse ne peut pas dépasser 500 caractères')
    .trim(),
  activity: z.string()
    .max(500, 'L\'activité ne peut pas dépasser 500 caractères')
    .trim()
    .optional(),
  capital: z.string()
    .max(50, 'Le capital ne peut pas dépasser 50 caractères')
    .optional(),
  associates_count: z.string()
    .optional()
});

export const serviceRequestSchema = z.object({
  contact_name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),
  email: z.string()
    .email('Email invalide')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères')
    .trim(),
  phone: z.string()
    .regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,8}$/, 'Numéro de téléphone invalide')
    .min(8, 'Le numéro doit contenir au moins 8 chiffres')
    .max(20, 'Le numéro ne peut pas dépasser 20 caractères')
    .trim(),
  company_name: z.string()
    .max(200, 'Le nom de l\'entreprise ne peut pas dépasser 200 caractères')
    .trim()
    .optional(),
  service_type: z.string()
    .min(2, 'Le type de service est requis')
});

export const ebookDownloadSchema = z.object({
  name: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim(),
  contact: z.string()
    .min(5, 'L\'email ou WhatsApp est requis')
    .max(255, 'Le contact ne peut pas dépasser 255 caractères')
    .trim()
    .refine(
      (val) => {
        const isEmail = z.string().email().safeParse(val).success;
        const isPhone = /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,8}$/.test(val);
        return isEmail || isPhone;
      },
      'Veuillez entrer un email ou un numéro WhatsApp valide'
    )
});

export const publicTrackingSchema = z.object({
  phone: z.string()
    .regex(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,8}$/, 'Numéro de téléphone invalide')
    .min(8, 'Le numéro doit contenir au moins 8 chiffres')
    .max(20, 'Le numéro ne peut pas dépasser 20 caractères')
    .trim()
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
export type CompanyRequestData = z.infer<typeof companyRequestSchema>;
export type ServiceRequestData = z.infer<typeof serviceRequestSchema>;
export type EbookDownloadData = z.infer<typeof ebookDownloadSchema>;
export type PublicTrackingData = z.infer<typeof publicTrackingSchema>;
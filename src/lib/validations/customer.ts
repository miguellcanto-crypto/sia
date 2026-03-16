import * as z from 'zod';

// Expresión regular para validar RFC de México (Personas Físicas y Morales)
const rfcRegex = /^([A-ZÑ&]{3,4}) ?(?:- ?)?(\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])) ?(?:- ?)?([A-Z\d]{2})([A\d])$/i;

// Regex para número de teléfono (solo dígitos, de 10 a 15 caracteres)
const phoneRegex = /^\d{10,15}$/;

export const customerSchema = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
    code: z.string().optional().or(z.literal('')),
    email: z.string().email('Correo electrónico inválido').optional().or(z.literal('')),
    phone: z.string()
        .regex(phoneRegex, 'El teléfono debe contener solo dígitos y tener entre 10 y 15 números')
        .optional()
        .or(z.literal('')),
    company: z.string().optional().or(z.literal('')),
    taxId: z.string()
        .regex(rfcRegex, 'Formato de RFC inválido')
        .optional()
        .or(z.literal('')),
    notes: z.string().optional().or(z.literal('')),
    creditLimit: z.coerce.number().min(0, 'El límite de crédito no puede ser negativo').optional().default(0),
});

export type CustomerFormValues = z.infer<typeof customerSchema>;

export const customerPointAdjustmentSchema = z.object({
    points: z.coerce.number().int('Los puntos deben ser números enteros'),
    reason: z.string().min(5, 'El motivo es obligatorio y debe ser descriptivo (min 5 caracteres)'),
});

export type CustomerPointAdjustmentValues = z.infer<typeof customerPointAdjustmentSchema>;

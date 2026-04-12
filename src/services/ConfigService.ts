import { PrismaClient, SystemConfig, Prisma, AuditAction } from '@/generated/client';
import { AuditService } from './AuditService';

let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
    prisma = new PrismaClient();
} else {
    if (!(global as any).prisma) {
        (global as any).prisma = new PrismaClient();
    }
    prisma = (global as any).prisma;
}

export type ConfigCategory = 'GENERAL' | 'SALES' | 'INVENTORY' | 'CREDIT' | 'TICKETS';

export interface SystemConfigInput {
    key: string;
    value: string;
    category: ConfigCategory | string;
    description?: string;
}

export class ConfigService {
    /**
     * Get all configurations, optionally filtered by category
     */
    static async getAll(category?: string) {
        const where = category ? { category } : {};
        return await prisma.systemConfig.findMany({
            where,
            orderBy: [{ category: 'asc' }, { key: 'asc' }],
        });
    }

    /**
     * Get a specific configuration by key
     */
    static async getByKey(key: string) {
        const config = await prisma.systemConfig.findUnique({
            where: { key }
        });
        return config?.value || null;
    }

    /**
     * Get a parsed config representation (helper for booleans/numbers)
     */
    static async getParsedValue(key: string, type: 'string'): Promise<string | null>;
    static async getParsedValue(key: string, type: 'number'): Promise<number | null>;
    static async getParsedValue(key: string, type: 'boolean'): Promise<boolean | null>;
    static async getParsedValue(key: string, type: 'string' | 'number' | 'boolean'): Promise<string | number | boolean | null> {
        const val = await this.getByKey(key);
        if (val === null) return null;

        if (type === 'number') return Number(val);
        if (type === 'boolean') return val.toLowerCase() === 'true';
        return val;
    }

    /**
     * Type validation for known config keys
     */
    private static validateType(key: string, value: string): void {
        const numberKeys = ['TAX_RATE', 'LOW_STOCK_ALERT_THRESHOLD', 'DEFAULT_CREDIT_LIMIT', 'CREDIT_DUE_DAYS'];
        const booleanKeys = ['ALLOW_NEGATIVE_STOCK', 'PRINT_RFC_ON_TICKET'];
        const nonEmptyStringKeys = ['STORE_NAME'];

        if (numberKeys.includes(key)) {
            const numVal = Number(value);
            if (isNaN(numVal) || numVal < 0) {
                throw new Error(`Invalid value for ${key}. Must be a positive number.`);
            }
            if (key === 'TAX_RATE' && numVal > 100) {
                throw new Error(`Invalid value for ${key}. Must be between 0 and 100.`);
            }
        }

        if (booleanKeys.includes(key)) {
            if (value.toLowerCase() !== 'true' && value.toLowerCase() !== 'false') {
                throw new Error(`Invalid value for ${key}. Must be 'true' or 'false'.`);
            }
        }

        if (nonEmptyStringKeys.includes(key)) {
            if (!value || value.trim() === '') {
                throw new Error(`Invalid value for ${key}. Cannot be empty.`);
            }
        }
    }

    /**
     * Create or update a single configuration
     */
    static async upsertConfig(
        input: SystemConfigInput,
        userId: string,
        sessionId?: string,
        ipAddress?: string,
        userAgent?: string
    ) {
        this.validateType(input.key, input.value);
        
        let existingOldValue = null;
        const currentConfig = await prisma.systemConfig.findUnique({ where: { key: input.key } });
        
        if (currentConfig) {
            existingOldValue = currentConfig.value;
        }

        const updatedConfig = await prisma.systemConfig.upsert({
            where: { key: input.key },
            update: {
                value: input.value,
                updatedBy: userId,
                ...(input.description && { description: input.description }),
            },
            create: {
                key: input.key,
                value: input.value,
                category: input.category,
                description: input.description,
                updatedBy: userId,
            }
        });

        if (existingOldValue !== input.value) {
           await AuditService.log(
                existingOldValue === null ? AuditAction.CREATE : AuditAction.UPDATE,
                'SystemConfig',
                updatedConfig.id,
                {
                    entityName: input.key,
                    oldValues: existingOldValue !== null ? { value: existingOldValue } : undefined,
                    newValues: { value: input.value },
                    metadata: {
                        userId,
                        sessionId,
                        ipAddress,
                        userAgent
                    }
                }
           );
        }

        return updatedConfig;
    }

    /**
     * Batch update configurations using a Prisma transaction. 
     * Enforces typed validation and logging for each change.
     */
    static async batchUpdate(
        configs: SystemConfigInput[],
        userId: string,
        sessionId?: string,
        ipAddress?: string,
        userAgent?: string
    ) {
        // Validate ALL first before persisting any
        configs.forEach(c => this.validateType(c.key, c.value));

        // Fetch current values to check what actually changes and log it
        const keys = configs.map(c => c.key);
        const currentConfigs = await prisma.systemConfig.findMany({
            where: { key: { in: keys } }
        });
        
        const currentMap = new Map(currentConfigs.map(c => [c.key, c]));

        const transactions: any[] = [];
        const auditLogs: any[] = [];

        configs.forEach(c => {
            const current = currentMap.get(c.key);
            
            transactions.push(
                prisma.systemConfig.upsert({
                    where: { key: c.key },
                    update: { value: c.value, updatedBy: userId },
                    create: { key: c.key, value: c.value, category: c.category, updatedBy: userId }
                })
            );

            // Only log if something changed
            if (!current || current.value !== c.value) {
                // We use prisma.auditLog.create directly inside the transaction
                // Note: using the explicit enums
                transactions.push(
                    prisma.auditLog.create({
                        data: {
                            action: !current ? AuditAction.CREATE : AuditAction.UPDATE,
                            entityType: 'SystemConfig',
                            entityId: `Key:${c.key}`, // Temporary ID, the real one is known after but fine for logging
                            entityName: c.key,
                            oldValues: current ? { value: current.value } : Prisma.JsonNull,
                            newValues: { value: c.value },
                            userId,
                            sessionId,
                            ipAddress,
                            userAgent
                        }
                    })
                );
            }
        });

        // Execute all updates and logs as a single transaction
        await prisma.$transaction(transactions);

        return { success: true, count: configs.length };
    }
}

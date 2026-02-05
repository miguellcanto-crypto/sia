export enum AuthErrorCode {
    INVALID_CREDENTIALS = 'CREDENTIALS_INVALIDAS',
    USER_NOT_FOUND = 'USUARIO_NO_ENCONTRADO',
    WRONG_PASSWORD = 'CONTRASENA_INCORRECTA',
    ACCOUNT_DISABLED = 'CUENTA_DESHABILITADA',
    RATE_LIMIT_EXCEEDED = 'LIMITE_DE_INTENTOS_EXCEDIDO',
    SESSION_EXPIRED = 'SESION_EXPIRADA',
}

export class AuthError extends Error {
    constructor(public code: AuthErrorCode, message?: string) {
        super(message || code);
        this.name = 'AuthError';
    }
}

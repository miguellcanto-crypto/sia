export async function sendPasswordResetEmail(email: string, token: string) {
    const resetLink = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

    console.log(`[MAIL MOCK] Sending password reset to ${email}: ${resetLink}`);

    // Phase 4 will implement real SMTP integration with nodemailer or similar
    // For now, we return success
    return true;
}

export async function sendVerificationEmail(email: string, token: string) {
    const verificationLink = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`;

    console.log(`[MAIL MOCK] Sending email verification to ${email}: ${verificationLink}`);

    return true;
}

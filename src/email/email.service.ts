import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);

    constructor(private mailer: MailerService) { }

    async sendVerificationEmail(to: string, token: string) {
        const link = `http://localhost:5173/verify?token=${token}`;

        try {
            await this.mailer.sendMail({
                to,
                subject: 'Verifikasi Akun',
                html: `
                    <h3>Verifikasi Akun</h3>
                    <p>Klik link di bawah:</p>
                    <a href="${link}">${link}</a>
                `,
            });
        } catch (error) {
            this.logger.error(`Failed to send verification email to ${to}: ${error.message}`);
        }
    }

    async sendPasswordResetEmail(to: string, token: string) {
        const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

        try {
            await this.mailer.sendMail({
                to,
                subject: 'Reset Password - Jeta Indonesia',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Reset Password</h2>
                        <p>Kami menerima permintaan reset password untuk akun Anda.</p>
                        <p>Klik tombol di bawah untuk mereset password Anda:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 6px; font-weight: bold;">
                                Reset Password
                            </a>
                        </div>
                        <p>Link ini berlaku selama <strong>1 jam</strong>.</p>
                        <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
                        <hr>
                        <p style="color: #666; font-size: 12px;">Jeta Indonesia</p>
                    </div>
                `,
            });
            this.logger.log(`Password reset email sent to ${to}`);
        } catch (error) {
            this.logger.error(`Failed to send password reset email to ${to}: ${error.message}`);
            throw error;
        }
    }
}
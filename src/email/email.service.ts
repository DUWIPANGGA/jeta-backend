import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class EmailService {
    constructor(private mailer: MailerService) { }

    async sendVerificationEmail(to: string, token: string) {
        const link = `http://localhost:5173/verify?token=${token}`;

        await this.mailer.sendMail({
            to,
            subject: 'Verifikasi Akun',
            html: `
        <h3>Verifikasi Akun</h3>
        <p>Klik link di bawah:</p>
        <a href="${link}">${link}</a>
      `,
        });
    }
}
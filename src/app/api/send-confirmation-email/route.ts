import { NextRequest, NextResponse } from 'next/server';
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { email, confirmationUrl } = await request.json();

    const msg = {
      to: email,
      from: 'noreply@invoice-pit.com', // SendGridで認証済みのメールアドレス
      subject: '【Invoice Pit】メールアドレスの確認',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #8B5CF6;">Invoice Pit へようこそ</h2>
          <p>アカウント登録ありがとうございます。</p>
          <p>以下のボタンをクリックして、メールアドレスを確認してください：</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" 
               style="background-color: #8B5CF6; color: white; padding: 12px 30px; 
                      text-decoration: none; border-radius: 8px; display: inline-block;">
              メールアドレスを確認
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            このリンクは24時間有効です。<br>
            もしこのメールに心当たりがない場合は、無視してください。
          </p>
        </div>
      `,
    };

    await sgMail.send(msg);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('SendGrid error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, FROM_EMAIL


def send_otp_email(to_email: str, otp_code: str) -> bool:
    if not SMTP_USER or not SMTP_PASSWORD:
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "TrustShield AI - OTP Verification"
        msg["From"] = FROM_EMAIL
        msg["To"] = to_email

        html = f"""
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #050816; color: #F8FAFC; padding: 40px; }}
                .container {{ max-width: 500px; margin: auto; background: #0F172A; border-radius: 16px; padding: 32px; border: 1px solid rgba(59,130,246,0.3); }}
                .logo {{ text-align: center; font-size: 24px; font-weight: bold; color: #3B82F6; margin-bottom: 20px; }}
                .otp {{ text-align: center; font-size: 48px; letter-spacing: 12px; font-weight: bold; color: #3B82F6; margin: 30px 0; padding: 20px; background: rgba(59,130,246,0.1); border-radius: 12px; }}
                .footer {{ text-align: center; color: #64748B; font-size: 12px; margin-top: 30px; }}
                .warning {{ text-align: center; color: #F59E0B; font-size: 14px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">TRUSTSHIELD AI</div>
                <p style="text-align:center;color:#94A3B8;">Your verification code</p>
                <div class="otp">{otp_code}</div>
                <p style="text-align:center;color:#94A3B8;">This code expires in 5 minutes</p>
                <p class="warning">If you did not request this, please ignore this email</p>
                <div class="footer">&copy; 2026 TrustShield AI. All rights reserved.</div>
            </div>
        </body>
        </html>
        """

        part = MIMEText(html, "html")
        msg.attach(part)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        return True
    except Exception:
        return False


def send_admin_alert(admin_email: str, subject: str, message: str) -> bool:
    if not SMTP_USER or not SMTP_PASSWORD:
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"TrustShield Alert - {subject}"
        msg["From"] = FROM_EMAIL
        msg["To"] = admin_email

        html = f"""
        <html>
        <body style="font-family: Arial, sans-serif; background: #050816; color: #F8FAFC; padding: 20px;">
            <div style="max-width:600px;margin:auto;background:#0F172A;border-radius:16px;padding:32px;border:1px solid rgba(239,68,68,0.3);">
                <h2 style="color:#EF4444;">Security Alert</h2>
                <p style="color:#94A3B8;">{message}</p>
            </div>
        </body>
        </html>
        """

        part = MIMEText(html, "html")
        msg.attach(part)

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(FROM_EMAIL, admin_email, msg.as_string())
        return True
    except Exception:
        return False

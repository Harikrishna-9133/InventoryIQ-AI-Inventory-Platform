import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

# Ensure .env is loaded
load_dotenv()


def get_admin_emails(db=None) -> list:
    """
    Returns a list of unique admin email addresses (SMTP_USER + DB Admins).
    """
    smtp_user = os.environ.get("SMTP_USER")
    admin_emails = set()

    if smtp_user:
        admin_emails.add(smtp_user)

    if db:
        try:
            from models import User
            db_admins = db.query(User).filter(User.role == "admin").all()
            for admin in db_admins:
                if admin.email:
                    admin_emails.add(admin.email)
        except Exception as e:
            print(f"[EMAIL SERVICE WARNING] Could not query DB admins: {e}")

    return list(admin_emails)


def send_single_email(subject: str, message_body: str, to_email: str, html_body: str = None) -> bool:
    """
    Sends an email to a single recipient using Gmail SMTP.
    """
    smtp_user = os.environ.get("SMTP_USER")
    smtp_password = os.environ.get("SMTP_PASSWORD")

    if not to_email:
        print("[EMAIL SERVICE ERROR] No recipient email address provided.")
        return False

    if not smtp_user:
        print("[EMAIL SERVICE ERROR] SMTP_USER is not set in backend/.env")
        return False

    if not smtp_password:
        print("[EMAIL SERVICE ERROR] SMTP_PASSWORD is not set in backend/.env")
        return False

    clean_password = smtp_password.replace(" ", "")

    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = f"InventoryIQ <{smtp_user}>"
        msg["To"] = to_email
        msg["Subject"] = subject

        msg.attach(MIMEText(message_body, "plain"))
        if html_body:
            msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(smtp_user, clean_password)
            server.sendmail(smtp_user, to_email, msg.as_string())

        print(f"[EMAIL SERVICE] Successfully sent '{subject}' to {to_email}")
        return True

    except smtplib.SMTPAuthenticationError:
        print(f"[EMAIL SERVICE ERROR] SMTP Auth failed when sending to {to_email}. Check Gmail App Password.")
        return False
    except Exception as e:
        print(f"[EMAIL SERVICE ERROR] Failed to send email to {to_email}: {str(e)}")
        return False


def send_alert_email(subject: str, message_body: str, to_email: str = None, html_body: str = None):
    """
    Legacy wrapper for sending alert email to a single target or default SMTP_USER.
    """
    if not to_email:
        to_email = os.environ.get("SMTP_USER")
    return send_single_email(subject, message_body, to_email, html_body)



def send_email_to_admin_and_supplier(
    subject: str,
    message_body: str,
    supplier_email: str = None,
    html_body: str = None,
    db=None,
    notification_type: str = "ALERT"
) -> dict:
    """
    Send notifications to admins and supplier.
    Record the actual send result for each recipient.
    """
    admin_list = get_admin_emails(db)

    # Normalize addresses and remove duplicates.
    admin_list = list({
        email.strip().lower()
        for email in admin_list
        if email and email.strip()
    })

    supplier_email = (
        supplier_email.strip().lower()
        if supplier_email and supplier_email.strip()
        else None
    )

    # Store each recipient's actual send result.
    delivery_results = {}

    # Notify supplier.
    if supplier_email:
        delivery_results[supplier_email] = send_single_email(
            subject=f"[SUPPLIER NOTICE] {subject}",
            message_body=message_body,
            to_email=supplier_email,
            html_body=html_body
        )

    # Notify admins. Avoid sending twice if the supplier is also an admin.
    for admin_email in admin_list:
        if admin_email == supplier_email:
            continue

        delivery_results[admin_email] = send_single_email(
            subject=subject,
            message_body=message_body,
            to_email=admin_email,
            html_body=html_body
        )

    # Record actual delivery submission results in the database.
    if db:
        try:
            from datetime import datetime
            from models import Notification

            for recipient, sent in delivery_results.items():
                notif = Notification(
                    recipient_email=recipient,
                    notification_type=notification_type,
                    subject=subject,
                    message=message_body,
                    status="sent" if sent else "failed",
                    sent_at=datetime.utcnow()
                )
                db.add(notif)

            db.commit()

        except Exception as e:
            db.rollback()
            print(
                "[EMAIL SERVICE WARNING] "
                f"Could not save notification records: {e}"
            )

    supplier_sent = (
        delivery_results.get(supplier_email, False)
        if supplier_email else False
    )

    admin_sent_count = sum(
        1 for email in admin_list
        if email != supplier_email
        and delivery_results.get(email, False)
    )

    success = any(delivery_results.values())

    print(
        "[EMAIL SERVICE SUMMARY] "
        f"Recipients={len(delivery_results)}, "
        f"Successful={sum(delivery_results.values())}, "
        f"Failed={sum(not sent for sent in delivery_results.values())}"
    )

    return {
        "success": success,
        "admin_emails_sent": admin_sent_count,
        "supplier_email_sent": supplier_sent,
        "recipients": list(delivery_results.keys()),
        "delivery_results": delivery_results
    }


import os
from dotenv import load_dotenv
from email_service import send_single_email

load_dotenv()

recipient = os.getenv("SMTP_USER")

if not recipient:
    raise RuntimeError(
        "SMTP_USER is missing. Check your backend/.env file."
    )

result = send_single_email(
    subject="InventoryIQ - Email Test",
    message_body=(
        "Hello!\n\n"
        "This is a test email from your InventoryIQ application.\n"
        "If you received this message, Gmail SMTP is working."
    ),
    to_email=recipient,
)

print("Email test result:", result)

if not result:
    raise SystemExit("Email sending failed. Check the error messages above.")

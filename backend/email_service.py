"""
Email Service using Resend
Handles all transactional emails for House Sharing Seniors
"""

import os
import asyncio
import logging
import resend
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize Resend
resend.api_key = os.environ.get("RESEND_API_KEY")
SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "apps@decsites.org")


async def send_email(to_email: str, subject: str, html_content: str) -> dict:
    """Send an email using Resend API (non-blocking)"""
    params = {
        "from": f"House Sharing Seniors <{SENDER_EMAIL}>",
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent successfully to {to_email}, ID: {email.get('id')}")
        return {"success": True, "email_id": email.get("id")}
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return {"success": False, "error": str(e)}


async def send_access_code_email(to_email: str, access_code: str) -> dict:
    """Send application access code for resume functionality"""
    subject = "Your House Sharing Seniors Application Access Code"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">House Sharing Seniors</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1a2332; margin-top: 0;">Your Access Code</h2>
            <p>You've started an application with House Sharing Seniors. Use the code below to resume your application at any time:</p>
            <div style="background: #f0f9ff; border: 2px solid #2563eb; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px;">{access_code}</span>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This code is linked to your email address: <strong>{to_email}</strong></p>
            <p>To resume your application:</p>
            <ol style="color: #4b5563;">
                <li>Visit our website and click "Resume Application"</li>
                <li>Enter your email address</li>
                <li>Enter this access code</li>
            </ol>
            <p style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                If you didn't start this application, you can safely ignore this email.<br>
                Questions? Contact us at info@housesharingseniors.com.au
            </p>
        </div>
    </body>
    </html>
    """
    return await send_email(to_email, subject, html_content)


async def send_application_submitted_email(to_email: str, applicant_name: str) -> dict:
    """Send confirmation when application is submitted"""
    subject = "Application Received - House Sharing Seniors"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">House Sharing Seniors</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1a2332; margin-top: 0;">Application Received!</h2>
            <p>Dear {applicant_name},</p>
            <p>Thank you for submitting your application to House Sharing Seniors. We're excited that you're interested in joining our community!</p>
            <div style="background: #d1fae5; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0; color: #065f46;"><strong>What happens next?</strong></p>
            </div>
            <ol style="color: #4b5563;">
                <li><strong>Review Process:</strong> Our team will review your application within 5-7 business days.</li>
                <li><strong>Verification:</strong> We'll verify your references and conduct necessary safety checks.</li>
                <li><strong>Decision:</strong> You'll receive an email with our decision and next steps.</li>
            </ol>
            <p>If we need any additional information, we'll be in touch.</p>
            <p style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                Questions? Contact us at info@housesharingseniors.com.au or call 1800 HSS AUS (1800 477 287)
            </p>
        </div>
    </body>
    </html>
    """
    return await send_email(to_email, subject, html_content)


async def send_application_approved_email(to_email: str, applicant_name: str, frontend_url: str = "") -> dict:
    """Send email when application is approved"""
    register_link = f"{frontend_url}/login?register=true&email={to_email}" if frontend_url else "#"
    subject = "Congratulations! Your Application is Approved - House Sharing Seniors"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">House Sharing Seniors</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #065f46; margin-top: 0;">Congratulations, {applicant_name}!</h2>
            <p>Great news! Your application to join House Sharing Seniors has been <strong style="color: #059669;">approved</strong>.</p>
            <div style="background: #d1fae5; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
                <p style="margin: 0; font-size: 18px; color: #065f46;"><strong>Welcome to the Community!</strong></p>
            </div>
            <p><strong>Your next step:</strong> Create your account to start using the platform. Click the button below — your email will be pre-filled.</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{register_link}" style="background: #059669; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Create Your Account</a>
            </div>
            <p><strong>Once registered, you can:</strong></p>
            <ul style="color: #4b5563;">
                <li>Browse and shortlist potential housemates</li>
                <li>View available properties in your area</li>
                <li>Express interest in properties</li>
                <li>Save your favourite properties and members</li>
            </ul>
            <p style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                Questions? Contact us at info@housesharingseniors.com.au or call 1800 HSS AUS (1800 477 287)
            </p>
        </div>
    </body>
    </html>
    """
    return await send_email(to_email, subject, html_content)


async def send_application_rejected_email(to_email: str, applicant_name: str, reason: str = None) -> dict:
    """Send email when application is rejected"""
    subject = "Application Update - House Sharing Seniors"
    reason_text = f"<p><strong>Reason:</strong> {reason}</p>" if reason else ""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">House Sharing Seniors</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1a2332; margin-top: 0;">Application Update</h2>
            <p>Dear {applicant_name},</p>
            <p>Thank you for your interest in House Sharing Seniors. After careful review, we regret to inform you that we're unable to approve your application at this time.</p>
            {reason_text}
            <p>This decision doesn't necessarily mean you can't reapply in the future. If your circumstances change or you have additional information that might support your application, please feel free to reach out to us.</p>
            <p>We appreciate your understanding and wish you the best in finding suitable accommodation.</p>
            <p style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                Questions? Contact us at info@housesharingseniors.com.au or call 1800 HSS AUS (1800 477 287)
            </p>
        </div>
    </body>
    </html>
    """
    return await send_email(to_email, subject, html_content)


async def send_contact_form_email(name: str, email: str, phone: str, subject: str, message: str) -> dict:
    """Send contact form submission to admin"""
    admin_subject = f"[Contact Form] {subject} - from {name}"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #1a2332; padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">New Contact Form Submission</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 120px;">Name:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">{name}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Email:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;"><a href="mailto:{email}">{email}</a></td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Phone:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">{phone or 'Not provided'}</td>
                </tr>
                <tr>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Subject:</td>
                    <td style="padding: 10px 0; border-bottom: 1px solid #e5e7eb;">{subject}</td>
                </tr>
            </table>
            <div style="margin-top: 20px;">
                <h3 style="color: #1a2332; margin-bottom: 10px;">Message:</h3>
                <div style="background: #f8fafb; padding: 16px; border-radius: 8px; white-space: pre-wrap;">{message}</div>
            </div>
        </div>
    </body>
    </html>
    """
    return await send_email(ADMIN_EMAIL, admin_subject, html_content)


async def send_password_reset_email(to_email: str, name: str, reset_link: str) -> dict:
    """Send password reset email with link"""
    subject = "Reset Your Password - House Sharing Seniors"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">House Sharing Seniors</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1a2332; margin-top: 0;">Password Reset Request</h2>
            <p>Hi {name},</p>
            <p>We received a request to reset your password. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_link}" style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
            <p style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                Questions? Contact us at info@housesharingseniors.com.au
            </p>
        </div>
    </body>
    </html>
    """
    return await send_email(to_email, subject, html_content)


async def send_registration_welcome_email(to_email: str, name: str) -> dict:
    """Send welcome email after approved applicant registers"""
    subject = "Welcome to House Sharing Seniors!"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">House Sharing Seniors</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #065f46; margin-top: 0;">Welcome, {name}!</h2>
            <p>Your account has been created successfully. You can now access all member features:</p>
            <ul style="color: #4b5563;">
                <li>Browse and shortlist potential housemates</li>
                <li>View available properties in your area</li>
                <li>Express interest in properties</li>
                <li>Manage your profile and preferences</li>
            </ul>
            <p style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                Questions? Contact us at info@housesharingseniors.com.au
            </p>
        </div>
    </body>
    </html>
    """
    return await send_email(to_email, subject, html_content)


async def send_contact_confirmation_email(to_email: str, name: str) -> dict:
    """Send confirmation to person who submitted contact form"""
    subject = "We've Received Your Message - House Sharing Seniors"
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">House Sharing Seniors</h1>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <h2 style="color: #1a2332; margin-top: 0;">Message Received!</h2>
            <p>Hi {name},</p>
            <p>Thank you for contacting House Sharing Seniors. We've received your message and will get back to you within 24 hours.</p>
            <p>In the meantime, you might find answers to common questions in our <a href="https://housesharingseniors.com.au/faq" style="color: #2563eb;">FAQ section</a>.</p>
            <p style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px;">
                This is an automated response. Please don't reply to this email.<br>
                Phone: 1800 HSS AUS (1800 477 287)
            </p>
        </div>
    </body>
    </html>
    """
    return await send_email(to_email, subject, html_content)

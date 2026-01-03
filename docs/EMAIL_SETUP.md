# Email Configuration Guide

## Overview

The system sends email notifications when items exceed their estimated return time. Both the user and lab admin receive notifications.

## Setup Instructions

### For Gmail

1. **Enable 2-Step Verification** on your Google Account
2. **Generate App Password**:
   - Go to Google Account → Security → 2-Step Verification
   - Scroll down to "App passwords"
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. **Add to `.env` file**:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM=your-email@gmail.com
```

### For Other SMTP Providers

```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=your-email@domain.com
```

## How It Works

1. **Lab Admin sets estimated return time** when issuing an item
2. **System checks every hour** for overdue items
3. **Emails are sent** to:
   - User who has the item
   - Lab Admin managing the lab
4. **Notification is marked as sent** to avoid duplicate emails

## Email Content

### User Email
- Subject: "⚠️ Overdue Item: [Item Name] - Return Required"
- Contains: Item details, issue date, estimated return date, overdue status

### Lab Admin Email
- Subject: "⚠️ Overdue Item Alert: [Item Name] - User: [User Name]"
- Contains: Item details, user information, issue date, estimated return date

## Testing

To test email functionality:
1. Issue an item with an estimated return time in the past
2. Wait for the cron job to run (or trigger manually)
3. Check both user and lab admin email inboxes

## Troubleshooting

- **Emails not sending**: Check email credentials in `.env`
- **Gmail blocking**: Use App Password, not regular password
- **SMTP errors**: Verify SMTP host and port settings
- **Check server logs**: Look for email service errors


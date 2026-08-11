# Secure deployment guide

Follow these steps in order. The site is designed to stay usable locally until the cloud controls are connected.

## 1. Prepare Supabase

1. Open your Supabase project.
2. Go to **SQL Editor** and run `supabase-setup.sql` once.
3. Go to **Authentication > Users** and create your administrator user with your personal email.
4. Back in **SQL Editor**, run this command with that same email:

```sql
insert into public.portfolio_admins (user_id)
select id from auth.users
where email = 'your-admin-email@example.com';
```

5. In **Authentication > Providers > Email**, turn off public sign-ups. Your portfolio has no public registration flow, so only the administrator account should exist.
6. Open `admin.html`, sign in, scan the QR code with Google Authenticator, Microsoft Authenticator, Authy, or a similar app, and verify the six-digit code. From that point, the database requires MFA for admin writes, media uploads, and inbox access.

## 2. Turn on protected contact messages

1. Create a Cloudflare Turnstile widget for your production domain. Choose **Managed** mode.
2. Put the public site key in `turnstileSiteKey` in `supabase-config.js`.
3. Install the Supabase CLI, log in, then deploy the public contact function:

```powershell
supabase functions deploy contact-submit
```

4. Add these function secrets in **Supabase > Edge Functions > Secrets**:

```text
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
TURNSTILE_SECRET_KEY=your-turnstile-secret
TURNSTILE_HOSTNAMES=your-domain.com,www.your-domain.com
CONTACT_RATE_LIMIT_SALT=a-long-random-private-value
```

The function verifies Turnstile server-side, checks the request origin, and limits each connection to five messages per hour.

## 3. Set up email alerts

1. Create a Resend account and verify your custom domain.
2. Deploy the notification function:

```powershell
supabase functions deploy contact-notification
```

3. Add these secrets:

```text
RESEND_API_KEY=your-resend-key
RESEND_FROM_EMAIL=Portfolio <hello@your-domain.com>
CONTACT_TO_EMAIL=your-inbox@your-domain.com
CONTACT_WEBHOOK_SECRET=a-second-long-random-private-value
```

4. In **Supabase > Database > Webhooks**, create an **INSERT** webhook for `public.contact_messages`. Use the `POST` method and this URL, replacing `your-project-ref` with the project reference shown in your Supabase project URL:

```text
https://your-project-ref.functions.supabase.co/contact-notification
```

Add this header:

```text
Authorization: Bearer your-second-long-random-private-value
```

## 4. Configure identity and trust details

1. In `supabase-config.js`, add your final `publicSiteUrl`, Turnstile site key, GitHub, and LinkedIn links.
2. Use a custom domain and a matching professional email address.
3. Configure SPF, DKIM, and DMARC through your email provider before sending portfolio mail from that domain.
4. The security disclosure address is published at `/.well-known/security.txt` and the privacy notice is at `/privacy.html`.

## 5. Deploy only the public package

Do not upload the project folder directly. Build the clean deployment folder first:

```powershell
powershell -ExecutionPolicy Bypass -File .\build.ps1
```

Deploy the generated `dist` folder to Cloudflare Pages, Netlify, or Vercel. It includes browser security headers, a restrictive CSP, HSTS, no-cache admin headers, and excludes SQL, deployment notes, and Edge Function source.

## 6. Schedule data retention

Create a monthly Supabase cron job to clear contact messages older than 90 days:

```sql
select cron.schedule(
  'purge-old-portfolio-contact-messages',
  '0 3 1 * *',
  $$select public.purge_expired_contact_messages();$$
);
```

Enable the `pg_cron` extension first if your project does not already provide it.

## 7. Verify before launch

1. Visit `admin.html` in a private browser window: it should remain locked until you sign in and complete MFA.
2. Create, edit, and delete one test portfolio item. Confirm the **Integrity Log** records each change.
3. Send one message through the public contact form. Confirm that it appears in the admin inbox and that the email alert arrives.
4. Check `/privacy.html`, `/security.html`, and `/.well-known/security.txt` on the deployed domain.

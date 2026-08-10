# Portfolio deployment checklist

## Supabase

1. Create a Supabase project.
2. Open SQL Editor and run `supabase-setup.sql`.
3. In Authentication > Users, create the admin email and password.
4. Copy the Project URL and anon key into `supabase-config.js`.
5. Open `admin.html`, sign in, and select **Import Starter Content**.

If you already ran the setup before the gallery/case-study fields were added, run `supabase-setup.sql` again. It safely adds the new `gallery_urls`, `role`, `stack_summary`, `learnings`, and `next_steps` columns without deleting existing content.

The SQL creates the content table, private contact inbox policies, scheduled publishing rules, and the public `portfolio-media` image bucket. Public visitors can read published records and submit contact messages. Authenticated users can manage content and inbox records.

## Site details

Edit `window.PORTFOLIO_SITE` in `supabase-config.js` to add `contactEmail`, `githubUrl`, `linkedinUrl`, and an optional Google Analytics `analyticsId`.

## Email notifications

The contact form already stores messages in the admin inbox. To add email alerts:

1. Deploy `supabase/functions/contact-notification/index.ts` as a Supabase Edge Function.
2. Add function secrets named `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, and `CONTACT_WEBHOOK_SECRET`.
3. In Supabase Database > Webhooks, create an INSERT webhook for `public.contact_messages` targeting the function URL.
4. Add an `Authorization: Bearer <CONTACT_WEBHOOK_SECRET>` header to the webhook.

## Hosting

Deploy the folder as a static site on Vercel, Cloudflare Pages, Netlify, or GitHub Pages. Keep all HTML, JavaScript, CSS, manifest, and image assets at the same public root.

# Joseph Clyde S. Daño — Portfolio

Personal portfolio of a software developer and computer engineer in Cebu City, Philippines: full-stack web development, backend services, AI integrations, and embedded systems.

Plain HTML, CSS, and JavaScript with no framework and no runtime dependencies. Supabase is optional and adds an admin area, a protected contact inbox, uploaded screenshots, and certificates.

## Features

- Dark and light themes, self-hosted Geist fonts, local icons, and a strict Content Security Policy
- Case-study pages for every project: problem, build notes, architecture, features, challenges, and lessons
- A printable resume page plus a downloadable PDF
- A contact form that delivers to a Supabase inbox (with Cloudflare Turnstile) or, without a backend, opens the visitor's email app with the message drafted
- Build step that generates canonical URLs, `sitemap.xml`, Open Graph tags, and schema.org `Person` data
- An [MCP server](mcp-server/README.md) so AI assistants can answer questions about the portfolio

## Run it locally

Requires Node.js 18 or newer.

```bash
npm run dev       # http://localhost:8080
npm run check     # validate content.js and page links, list what is still missing
npm run build     # check, then create the deployable dist/ folder
npm run preview   # serve dist/ to test the production build
```

## Updating content

Everything public is rendered from **[content.js](content.js)**: profile, experience, projects, tech stack, and education. Edit it, run `npm run check`, then commit.

- Leave unknown fields as `""` or `[]`; empty fields are hidden, never faked.
- Put screenshots in `images/` and set `image` (or `gallery`) on the project. Projects without one show a labelled illustration.
- Search for `TODO` to find details that still need confirming.
- Replace `Joseph-Clyde-Dano-Resume.pdf` to update the downloadable resume.

## Project structure

| Path | Purpose |
| --- | --- |
| `index.html`, `home.js` | Home page |
| `project.html`, `project-view.js` | Case-study page (`project.html?id=...`) |
| `resume.html`, `resume.js` | Printable resume |
| `content.js` | All public content |
| `styles.css` | Site styles (both themes) |
| `site.js` | Shared behaviour: theme, navigation, reveal animations, copy-to-clipboard |
| `contact.js` | Contact form (secure inbox or email-app mode) |
| `supabase-config.js` | Supabase keys, site URL, Turnstile key, analytics id |
| `portfolio-data.js`, `admin.*` | Supabase data layer and the MFA-protected admin |
| `supabase/`, `supabase-*.sql` | Database setup and Edge Functions (never deployed) |
| `scripts/` | Build, dev server, and content check |
| `mcp-server/` | Model Context Protocol server |

## Deployment

Vercel builds the site with `npm run build` and publishes only `dist/` (see [vercel.json](vercel.json)). SQL, Edge Function source, docs, and the MCP server are never published. Full setup, including Supabase, Turnstile, and email alerts, is in [DEPLOYMENT.md](DEPLOYMENT.md).

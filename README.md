# فرصة (Forsa)

**A community opportunity network for Jazan, Saudi Arabia.** A free initiative that helps skilled people, productive families (الأسر المنتجة), and individuals, companies, and organizations find each other, then talk directly.

The interface is Arabic-only and RTL. Forsa is only a place to discover: it has no payments, commissions, contracts, delivery, or negotiation. Every connection happens directly between the two people, by WhatsApp, phone call, or email.

## What's in the MVP

| Area                                  | What it does                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Home** (`/`)                        | Hero with search by need and governorate, three entry paths (I have a skill / productive family / I'm looking for…), latest opportunities, families, a corporate-catering band, talents, human stories, discover-by-governorate, how it works                                                                                                     |
| **Opportunities** (`/opportunities`)  | Jobs, tasks, product and catering orders, training, and volunteering. Filters by type, field, area, and free text                                                                                                                                                                                                                                 |
| **Talents** (`/talents`)              | Profiles of skilled people. Filters by field, what they're looking for (full-time, part-time, freelance, extra income), area, and text                                                                                                                                                                                                            |
| **Productive families** (`/families`) | Family pages with a story, products, and indicative prices. Filter for families that accept event and corporate orders                                                                                                                                                                                                                            |
| **Search** (`/search`)                | Unified results across all three sides. Arabic-aware: normalizes alef, taa marbuta and diacritics, strips «ال» and attached prefixes, matches word starts rather than fragments, understands synonyms and colloquial phrasing («ابغى مصور»), treats governorate names as places, and falls back to the closest matches for long natural sentences |
| **Detail pages**                      | Contact panel, share (WhatsApp first), report, similar items                                                                                                                                                                                                                                                                                      |
| **Join** (`/join`)                    | Three posting flows with no account needed: talent profile, family page (with photo upload), opportunity. Owners can also choose to **save a management link on their device** from its manage page; saved links are then listed on `/join`. Nothing is saved automatically, because phones are often shared within a family                      |
| **Manage** (`/manage/[token]`)        | Private link shown after posting. The owner can **edit** the listing (keep, remove, or replace photos), hide or show it, mark an opportunity as filled, toggle availability, see how many people asked for their contact details, or delete it permanently (photos included)                                                                      |
| **Moderation** (`/admin`)             | For the initiative team only, and switched on by `FORSA_ADMIN_KEY`. Shows open reports (hide, delete, or close each one) and recent listings with hide and delete actions. A listing hidden by moderators stays hidden: its owner sees a notice and can edit or delete it, but can't make it visible again                                        |
| **About** (`/about`)                  | The initiative, what Forsa does and doesn't do, safe-contact tips, FAQ. Photo credits are at `/credits`                                                                                                                                                                                                                                           |

### Trust and privacy decisions

- **Opportunities stay fresh.** After 30 days without renewal, an opportunity is tagged «قد تكون انتهت» ("may have ended"). It drops below fresh ones and is left off the home page. Its owner can renew it from the management link, at most once every 7 days.
- **Contact details are never in the page HTML.** They're fetched through a Server Action only when a visitor asks («أظهر وسائل التواصل»), which makes scraping harder.
- **No personal photos.** People are shown with a letter avatar inside the brand's leaf shape, topped with the logo's diamond dot. This respects local privacy norms, especially for women.
- **Uploaded photos are re-encoded on the server** with `sharp` and all metadata is stripped, including GPS location. This matters for families photographing products at home. Photos are also resized in the browser before upload so posting is quick on mobile data.
- A **honeypot field** and **per-visitor rate limits** catch spam and scraping: 8 new listings an hour, 30 contact reveals an hour (each listing counts once a day per visitor), and 10 reports an hour. Visitors are identified by a hash of their IP address, taken from `X-Real-IP` or the last `X-Forwarded-For` entry, so the reverse proxy in front of the app must set one of those headers. Raw IP addresses aren't stored. Every listing has a **report** button.
- **Management uses secret links**: tokens are stored hashed (SHA-256). There are no passwords to leak. Management pages send no `Referer` header, so the link can't leak to WhatsApp or other sites.
- **Security headers** are set in `next.config.ts`: `nosniff`, `X-Frame-Options: DENY`, a strict referrer policy and a restrictive permissions policy.

### Demo content

The seed listings in `src/lib/seed/*` are illustrative examples inspired by Jazan: 14 talents, 10 families, and 16 opportunities. They're flagged `seed: true`, and their contact buttons show a "demo profile" notice instead of contacting anyone. They're kept out of the sitemap and marked `noindex`.

**At launch, set `FORSA_DEMO=off`** when you build and when you run the app. The seed content disappears, and every section switches to a "be the first to post" invitation. The home hero then shows an illustration of the three sides connecting in place of example cards.

## Design system

Everything comes from the logo (`public/brand/forsa-logo.svg`), which is used exactly as provided and always on a light background.

- **Color.** Clay/terracotta `#A63F2B` (the wordmark) and sage `#72A98F` (the three sparks), extended into full scales. They sit on warm sand backgrounds, with a warm brown "ink" for text. Tokens are in `src/app/globals.css` (`clay-*`, `sage-*`, `sand-*`, `ink-*`).
- **The nuqta (النقطة).** The logo's diamond dot, with its single rounded corner, is traced exactly (`<Nuqta />`). It's used for bullets, the active-nav marker, step numbers, avatar accents, background lattices, and loading hints.
- **The leaf shape.** The nuqta's inverse, with three soft corners and one sharp one (`rounded-ee-[…]`), is the signature shape for cards, buttons, panels, and avatars.
- **Sparks.** The three green shards above the ص (`<Sparks />`) mark highlighted words («جازان مليانة **فرص**»), empty states, and moments of success.
- **Typography.** [Alyamama](https://fonts.google.com/specimen/Alyamama) is used for headings: heavy, warm, and confident like the wordmark. [IBM Plex Sans Arabic](https://fonts.google.com/specimen/IBM+Plex+Sans+Arabic) is used for body text. Numbers use Arabic-Indic digits and the Gregorian calendar (`ar-SA-u-ca-gregory-nu-arab`).
- **Local details.** An ornament band of diamonds and triangles echoes Tihama/Asir painted art (القط العسيري). There are also custom dallah (coffee pot) and mabkhara (incense burner) icons, and copy in warm Saudi phrasing («وش تدوّر عليه؟», «خلّ الفرصة تلقاك»).
- **Favicon and share image.** These are built only from logo elements (the nuqta and the sparks) and don't alter the logo.

## Tech

- Next.js 16 (App Router, Turbopack), React 19, Tailwind CSS v4, TypeScript, Zod, sharp, lucide-react.
- Server Components for all data pages. Server Actions handle posting, contact reveal, reports, and listing management. Forms work before JavaScript loads. After it loads, they keep entered values when validation fails or the connection drops, and they wait for photos to finish resizing before sending.
- **Data layer.** `src/lib/store.ts` is a small JSON-file store (`.data/forsa.json`, uploads in `.data/uploads/`) with serialized atomic writes. All reads go through `src/lib/data.ts`. To move to a database such as Postgres or Supabase, replace those two files. Set `FORSA_DATA_DIR` to put the data directory somewhere persistent.

```
src/
  app/            routes (home, opportunities, talents, families, search, join, manage, admin, about, credits, media)
  components/     design system (brand, ui, cards, forms, icons) + page sections
  lib/            taxonomy, seed data, search, store, uploads, formatting
```

## Running locally

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm lint
pnpm build && pnpm start
```

Optional environment variables:

- `NEXT_PUBLIC_SITE_URL`: the public URL, used for metadata, sitemap, and share links.
- `FORSA_DATA_DIR`: where listings and uploads are stored. Defaults to `./.data`.
- `FORSA_DEMO=off`: hides the demo content, for launch.
- `FORSA_ADMIN_KEY`: a secret of 12 characters or more that turns on the moderation page at `/admin`. If it isn't set, that page returns 404.
- `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`: set this to a stable value if you run more than one instance.

> The JSON store needs a persistent disk, so run it on a normal Node server or a VPS. Serverless platforms have ephemeral filesystems, so move the data layer to a database before deploying there. The rate limits are kept in memory for a single server process too: with several instances, move them to a shared store such as Redis.

## Photo credits

Stock photos in `public/images/` are listed with author, source, and license in `public/images/credits.json`. They're also shown on the `/credits` page, which is linked from the footer.

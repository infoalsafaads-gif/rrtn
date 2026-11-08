# AL SAFA — portfolio data

The website is a static GitHub Pages site. The work grid is rendered from `portfolio-data.json`; project content is not hard-coded into the page.

## Current import status

- Behance profile: https://www.behance.net/a2b6d985
- Verified projects imported: 0
- No project cards or project artwork have been invented.

The supplied profile URL could not be opened by the available public-page inspector, and no verified list of projects, covers, or project URLs could be collected from it. Behance's current sharing guidance supports embedding individual public projects, but embedding is not the same as an independent locally hosted portfolio. The site therefore uses a local project manifest and individual case-study pages. Do not add a project until its title, source URL, and original cover/media are verified.

## Project record

Add one object per verified public project to the `projects` array in `portfolio-data.json`:

```json
{
  "slug": "lowercase-project-slug",
  "title": "Exact project title",
  "category": "A category supported by this work",
  "summary": "A short, factual summary",
  "description": "The longer project description, based on the original Behance project.",
  "coverImage": "./assets/portfolio/project-cover.webp",
  "coverAlt": "Accurate description of the image",
  "year": "2026",
  "client": "Client name, only if public",
  "services": ["Branding", "Social media design"],
  "behanceUrl": "https://www.behance.net/gallery/PROJECT_ID/PROJECT-SLUG",
  "sections": [
    { "type": "heading", "text": "The brief" },
    { "type": "paragraph", "text": "Verified project text." },
    {
      "type": "image",
      "src": "./assets/portfolio/project-detail-01.webp",
      "alt": "Accurate image description",
      "caption": "Optional caption"
    }
  ]
}
```

## Import and image rules

1. Keep the exact project title and public project URL from Behance.
2. Download or export only your own original project images at their best available quality, and store them under `assets/portfolio/`.
3. Use descriptive, lowercase image filenames. Keep the original proportions; the website crops only cover thumbnails with CSS.
4. Add only categories supported by the actual project content. Filter buttons are generated automatically from the categories present in the data.
5. Use a unique `slug` per project. The detail route is `project.html?slug=lowercase-project-slug`.
6. The project detail view supports `heading`, `paragraph`, and `image` sections, plus previous/next navigation and related projects.

## Why this is not auto-synced

The official Behance sharing guidance documents individual project embeds, not a supported profile-wide sync feed. The old Behance API migration has also been documented as unavailable in Adobe community discussions. This static import approach avoids relying on an undocumented endpoint or an unverified third-party scraper, and lets the site's project pages stay independent of Behance embeds.

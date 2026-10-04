# SEO release checklist

These changes do not modify the database or automatically deploy the website.

## Coolify environment

Set these on the web application before rebuilding:

- `NEXT_PUBLIC_SITE_URL=https://doniputra.com` (build time and runtime).
- `NEXT_PUBLIC_API_URL`: the existing publicly reachable HTTPS API origin (build time and runtime). Do not use a Docker hostname, localhost, or a private IP here.
- `API_URL`: the existing server-to-server API origin (runtime); a private Docker hostname is fine.
- Optional `GOOGLE_SITE_VERIFICATION`: the token from Search Console's HTML-tag verification method, not the entire meta tag. DNS verification needs no token.

Public `NEXT_PUBLIC_` values are embedded in the client build. Changing them requires a rebuild, not only a restart. Keep uploaded media on the API's persistent storage volume and ensure the public API domain serves `/uploads/` without authentication.

## Verify after deployment

The read-only crawler audit can be rerun against a running local production build or the deployed site:

```sh
cd apps/web
npm run seo:audit -- http://localhost:3000
# After deployment:
npm run seo:audit -- https://doniputra.com
```

It checks every sitemap URL, titles, descriptions, canonical URLs, bot-visible share metadata, JSON-LD, social image delivery, RSS, admin exclusions, search filters, and missing-page responses. It is not a Google ranking or Core Web Vitals score.

1. Open `https://doniputra.com/robots.txt` and `https://doniputra.com/sitemap.xml`.
2. Confirm all published blog and project detail URLs appear in the sitemap. Drafts, archived projects, admin pages, search/filter URLs, and fragment URLs must not appear. The sitemap follows all API pages; it is not limited to the first 100 entries. An API outage returns an error rather than a misleading partial sitemap.
3. Confirm one canonical HTTPS hostname is used. Configure Coolify's domains/proxy to permanently redirect HTTP and the alternate `www` hostname to `https://doniputra.com`. Metadata alone does not perform these redirects.
4. Check a blog and project with Google's [Rich Results Test](https://search.google.com/test/rich-results) and [Schema Markup Validator](https://validator.schema.org/). Project case studies use `CreativeWork`, not a fictitious product rating; not every schema type creates a rich result.
5. Check a shared article's large banner. Open its `og:image` URL without a login; it must return an image, not an HTML error. Clear the sharing platform's preview cache when replacing an existing image.
6. Verify `/admin/login` has `noindex, nofollow` and admin responses have `X-Robots-Tag`. Robots rules are crawler guidance, not access control; authentication still protects the admin.
7. Use [PageSpeed Insights](https://pagespeed.web.dev/) on the deployed homepage and an article, including the mobile report. A local development build is not a valid production performance benchmark.

## Search Console

1. Add and verify the `doniputra.com` Domain property with its DNS TXT record, or verify the HTTPS URL-prefix property.
2. Submit `sitemap.xml` in Sitemaps. Google Analytics setup does not submit a sitemap or guarantee indexing.
3. Use URL Inspection on the homepage, one article, and the new project detail pages. Check the live test, canonical, indexing permissions, and rendered content; request indexing after the release.
4. Monitor Page indexing, Core Web Vitals, and Search results. Fix crawl failures and actual reader problems before optimizing keywords.

## Publishing in the CMS

Existing title, excerpt, cover image, SEO title, and SEO description fields are used directly. Keep titles specific and descriptions informative; don't stuff keywords. Use the real publication date, update the content when changing its modification date, and keep authorship and claims consistent with visible evidence. Sitemap, article schema, social previews, and RSS update from published data without a migration or manual sitemap edit.

Search results and rich results are not guaranteed. See Google's [sitemap guidance](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [article guidance](https://developers.google.com/search/docs/appearance/structured-data/article), and [pagination guidance](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading).

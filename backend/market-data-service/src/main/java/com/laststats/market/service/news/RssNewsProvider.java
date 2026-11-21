package com.laststats.market.service.news;

import com.rometools.rome.feed.synd.SyndEntry;
import com.rometools.rome.feed.synd.SyndEnclosure;
import com.rometools.rome.feed.synd.SyndFeed;
import com.rometools.rome.io.SyndFeedInput;
import com.rometools.rome.io.XmlReader;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.Reader;
import java.io.StringReader;
import java.net.URL;
import java.net.URLConnection;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

/**
 * Reads a publisher's own public RSS feed via ROME (a real RSS/Atom parser
 * library, not a scrape of rendered HTML). Only headline/summary/link/image
 * metadata is kept — never full article bodies — matching spec §5's
 * "store/display permitted metadata" rule. "Read Original" on the frontend
 * always points at `sourceUrl`, the publisher's own article page.
 */
public class RssNewsProvider implements NewsProvider {
    private static final Logger log = LoggerFactory.getLogger(RssNewsProvider.class);
    private static final int TIMEOUT_MS = 8000;

    // Some publishers (e.g. SCMP) embed raw, unescaped HTML void elements
    // (<hr>, <br>, <img ...>) directly in feed XML instead of self-closing
    // them (<hr/>). That's invalid XML and makes ROME reject the ENTIRE feed
    // rather than just that one field. We only ever extract title/summary/
    // link/image (never re-render raw HTML), so it's safe to self-close
    // these tags before parsing so one publisher's malformed markup doesn't
    // zero out their whole feed.
    //
    // IMPORTANT: "link" and "meta" must NOT be in this list. <link>...</link>
    // is RSS/Atom's own core structural element (every entry's article URL
    // lives inside one) and is a real paired tag, not an HTML void element —
    // self-closing it here previously mangled every single feed's XML
    // identically (orphaned closing </link> tags cascading into an unclosed
    // </channel>), which is why ALL providers were failing at once rather
    // than just the ones with genuinely malformed markup.
    private static final Pattern UNCLOSED_VOID_TAG = Pattern.compile(
            "<(br|hr|img|input)((?:\\s+[a-zA-Z_:][\\w:.-]*(?:=(?:\"[^\"]*\"|'[^']*'))?)*)\\s*>",
            Pattern.CASE_INSENSITIVE);

    private final String feedUrl;
    private final String sourceName;
    private final String country;
    private final String region;

    public RssNewsProvider(String feedUrl, String sourceName, String country, String region) {
        this.feedUrl = feedUrl;
        this.sourceName = sourceName;
        this.country = country;
        this.region = region;
    }

    @Override
    public String sourceName() { return sourceName; }

    @Override
    public String defaultCountry() { return country; }

    @Override
    public String defaultRegion() { return region; }

    @Override
    public List<RawNewsItem> fetch() {
        List<RawNewsItem> items = new ArrayList<>();
        try {
            URLConnection connection = new URL(feedUrl).openConnection();
            connection.setConnectTimeout(TIMEOUT_MS);
            connection.setReadTimeout(TIMEOUT_MS);
            // Some publishers 403 requests with no User-Agent at all.
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (compatible; LastStatsNewsBot/1.0)");

            // Read through XmlReader first so it still detects the feed's
            // real encoding from the BOM/declaration/HTTP header, then
            // sanitize the decoded text before parsing — this way the
            // self-closing fix doesn't fight with charset detection.
            String rawXml = readAll(new XmlReader(connection));
            String sanitized = UNCLOSED_VOID_TAG.matcher(rawXml).replaceAll("<$1$2/>");

            SyndFeedInput input = new SyndFeedInput();
            SyndFeed feed = input.build(new StringReader(sanitized));

            for (SyndEntry entry : feed.getEntries()) {
                String title = clean(entry.getTitle());
                String link = entry.getLink();
                if (title == null || title.isBlank() || link == null || link.isBlank()) continue;

                String description = entry.getDescription() != null ? clean(entry.getDescription().getValue()) : null;
                Instant publishedAt = entry.getPublishedDate() != null ? entry.getPublishedDate().toInstant()
                        : entry.getUpdatedDate() != null ? entry.getUpdatedDate().toInstant()
                        : Instant.now();

                String imageUrl = null;
                if (entry.getEnclosures() != null) {
                    for (SyndEnclosure enclosure : entry.getEnclosures()) {
                        if (enclosure.getType() != null && enclosure.getType().startsWith("image")) {
                            imageUrl = enclosure.getUrl();
                            break;
                        }
                    }
                }

                items.add(new RawNewsItem(title, description, link, imageUrl, publishedAt));
            }
        } catch (Exception e) {
            // One dead/rate-limited/unreachable feed must never break the rest
            // of a refresh run (spec §27) — log and move on with what we have.
            log.warn("RSS fetch failed for {} ({}): {}", sourceName, feedUrl, e.getMessage());
        }
        return items;
    }

    // Drains a Reader into a String so we can regex-sanitize the decoded
    // XML text before handing it to ROME's parser.
    private String readAll(Reader reader) throws java.io.IOException {
        StringBuilder sb = new StringBuilder();
        try (BufferedReader br = new BufferedReader(reader)) {
            char[] buf = new char[8192];
            int n;
            while ((n = br.read(buf)) != -1) {
                sb.append(buf, 0, n);
            }
        }
        return sb.toString();
    }

    // Strips HTML tags RSS descriptions commonly embed and unescapes the
    // handful of entities that show up almost universally. Not a full HTML
    // parser — good enough for a one-line summary, never used to reconstruct
    // or redisplay full article content.
    private String clean(String raw) {
        if (raw == null) return null;
        String noTags = raw.replaceAll("<[^>]+>", " ");
        String unescaped = noTags
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&#39;", "'")
                .replace("&apos;", "'");
        return unescaped.replaceAll("\\s+", " ").trim();
    }
}

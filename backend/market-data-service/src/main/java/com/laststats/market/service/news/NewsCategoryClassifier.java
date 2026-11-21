package com.laststats.market.service.news;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * Lightweight keyword classifier that tags each headline with one of the
 * categories from spec §7. RSS feeds don't carry a financial sub-category
 * themselves, so this is inferred from title+description text — it's a
 * heuristic, not a guarantee, and defaults to "Markets" when nothing
 * matches. Order matters: checked top-to-bottom, first match wins, so
 * more specific categories are listed before more general ones.
 */
public final class NewsCategoryClassifier {
    private NewsCategoryClassifier() {}

    private static final Map<String, String[]> KEYWORDS = new LinkedHashMap<>();
    static {
        KEYWORDS.put("Central Banks", new String[]{"federal reserve", "fed ", " fed", "rbi", "reserve bank",
                "ecb", "bank of japan", "boj", "bank of england", "pboc", "central bank"});
        KEYWORDS.put("Interest Rates", new String[]{"interest rate", "rate cut", "rate hike", "policy rate", "repo rate"});
        KEYWORDS.put("Inflation", new String[]{"inflation", "cpi", "consumer price"});
        KEYWORDS.put("IPO", new String[]{"ipo", "initial public offering", "stock market debut", "listing debut"});
        KEYWORDS.put("Crypto", new String[]{"bitcoin", "crypto", "ethereum", "blockchain", "stablecoin"});
        KEYWORDS.put("Forex", new String[]{"forex", "currency", "exchange rate", "dollar index", "rupee", "yen ", "euro ", "pound sterling"});
        KEYWORDS.put("Commodities", new String[]{"crude oil", "gold price", "commodity", "commodities", "silver price", "opec"});
        KEYWORDS.put("Bonds", new String[]{"bond yield", "treasury yield", "government bond", "corporate bond"});
        KEYWORDS.put("Banking", new String[]{"bank earnings", "banking sector", "lender", "loan book", "npa"});
        KEYWORDS.put("Energy", new String[]{"oil price", "energy sector", "renewable energy", "natural gas", "opec+"});
        KEYWORDS.put("Technology", new String[]{"tech stock", "semiconductor", "artificial intelligence", "chipmaker", "software company"});
        KEYWORDS.put("Geopolitics", new String[]{"tariff", "sanctions", "trade war", "geopolitical", "war impact on markets"});
        KEYWORDS.put("Economy", new String[]{"gdp", "economic growth", "unemployment", "jobs report", "recession", "economy"});
        KEYWORDS.put("Companies", new String[]{"earnings", "quarterly results", "merger", "acquisition", "ceo", "profit"});
        KEYWORDS.put("Stocks", new String[]{"stock", "shares", "equity", "nasdaq", "sensex", "nifty", "dow jones", "s&p 500"});
    }

    public static String classify(String title, String description) {
        String text = ((title == null ? "" : title) + " " + (description == null ? "" : description)).toLowerCase(Locale.ROOT);
        for (Map.Entry<String, String[]> entry : KEYWORDS.entrySet()) {
            for (String keyword : entry.getValue()) {
                if (text.contains(keyword)) return entry.getKey();
            }
        }
        return "Markets";
    }
}

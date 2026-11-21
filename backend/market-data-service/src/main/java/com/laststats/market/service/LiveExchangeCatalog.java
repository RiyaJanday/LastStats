package com.laststats.market.service;

import java.util.Map;

/**
 * The ONLY exchanges the Global Markets Map pulls live data for.
 *
 * Every other exchange in exchanges.json still shows on the map (name, country,
 * type) but is reported as "No live data source" — this catalog is the single
 * place that decides which ones get a live quote, so adding or removing a
 * live exchange is a one-line change here (no need to edit exchanges.json).
 *
 * yahooSymbol == null means "this exchange is on the live list but there is
 * no free Yahoo Finance index symbol for it" — the map shows
 * "Data not available" for it rather than a made-up number. Several symbols
 * below (marked "unverified") are best-effort Yahoo tickers that could not be
 * checked from the build environment: if one returns "Data not available" at
 * runtime, look the index up on finance.yahoo.com and correct the symbol here.
 */
final class LiveExchangeCatalog {
    private LiveExchangeCatalog() {}

    record Spec(String trackingKey, String indexName, String yahooSymbol) {}

    private static Map.Entry<String, Spec> e(String exchangeId, String key, String indexName, String yahooSymbol) {
        return Map.entry(exchangeId, new Spec(key, indexName, yahooSymbol));
    }

    /** exchange id (exchanges.json) -> live index definition */
    static final Map<String, Spec> BY_EXCHANGE_ID = Map.ofEntries(
            // ---- Asia-Pacific & Middle East ----
            e("nse-india", "NIFTY50", "NIFTY 50", "^NSEI"),
            e("bse-india", "SENSEX", "SENSEX", "^BSESN"),
            e("tse-tokyo", "N225", "Nikkei 225", "^N225"),
            e("sse-shanghai", "SSEC", "SSE Composite", "000001.SS"),
            e("szse", "SZI", "SZSE Component", "399001.SZ"),
            e("hkex", "HSI", "Hang Seng Index", "^HSI"),
            e("krx", "KOSPI", "KOSPI", "^KS11"),
            e("twse", "TWII", "TAIEX", "^TWII"),
            e("tpex", "TWOII", "TPEx Composite", "^TWOII"),                 // unverified
            e("sgx", "STI", "Straits Times Index", "^STI"),
            e("bursa-malaysia", "KLSE", "FBM KLCI", "^KLSE"),
            e("idx", "JKSE", "IDX Composite", "^JKSE"),
            e("set-thailand", "SET", "SET Index", "^SET.BK"),
            e("pse-philippines", "PSEI", "PSEi", "PSEI.PS"),
            e("hsx", "VNINDEX", "VN-Index", "^VNINDEX.VN"),                  // unverified
            e("hnx", "HNXINDEX", "HNX-Index", null),                         // no free feed known
            e("asx", "AXJO", "ASX 200", "^AXJO"),
            e("nzx", "NZ50", "NZX 50", "^NZ50"),
            e("psx", "KSE100", "KSE-100", "^KSE"),                           // unverified
            e("dse-dhaka", "DSEX", "DSEX", null),                            // no free feed known
            e("cse-chittagong", "CSEALL", "CSE All Share", null),            // no free feed known
            e("cse-colombo", "ASPI", "All Share Price Index", null),         // no free feed known
            e("tadawul", "TASI", "Tadawul All Share (TASI)", "^TASI.SR"),
            e("adx", "ADI", "FTSE ADX General Index", "^FTFADGI"),           // unverified
            e("dfm", "DFMGI", "DFM General Index", "^DFMGI"),                // unverified
            e("qse", "QSI", "QE Index", "^GNRI.QA"),
            e("boursa-kuwait", "BKP", "Boursa Kuwait Premier", "^BKP"),      // unverified
            e("tase", "TA125", "TA-125", "^TA125.TA"),
            e("borsa-istanbul", "BIST100", "BIST 100", "XU100.IS"),

            // ---- Europe ----
            e("lse", "FTSE", "FTSE 100", "^FTSE"),
            e("frankfurt-se", "GDAXI", "DAX", "^GDAXI"),
            e("xetra", "GDAXI", "DAX", "^GDAXI"),
            e("euronext-paris", "FCHI", "CAC 40", "^FCHI"),
            e("euronext-amsterdam", "AEX", "AEX", "^AEX"),
            e("six-swiss", "SSMI", "SMI", "^SSMI"),
            e("borsa-italiana", "FTSEMIB", "FTSE MIB", "FTSEMIB.MI"),
            e("bolsa-madrid", "IBEX", "IBEX 35", "^IBEX"),
            e("euronext-lisbon", "PSI20", "PSI 20", "PSI20.LS"),             // unverified
            e("euronext-brussels", "BFX", "BEL 20", "^BFX"),
            e("nasdaq-stockholm", "OMXS30", "OMX Stockholm 30", "^OMX"),
            e("oslo-bors", "OSEBX", "OSE Benchmark", "OSEBX.OL"),            // unverified
            e("nasdaq-copenhagen", "OMXC25", "OMX Copenhagen 25", "^OMXC25"),
            e("nasdaq-helsinki", "OMXH25", "OMX Helsinki 25", "^OMXH25"),
            e("gpw", "WIG20", "WIG20", "WIG20.WA"),
            e("wiener-borse", "ATX", "ATX", "^ATX"),
            e("athex", "ATHEX", "Athens General Composite", "GD.AT"),
            e("euronext-dublin", "ISEQ", "ISEQ Overall", "^ISEQ"),           // unverified
            e("pse-prague", "PX", "PX Index", "^PX"),                        // unverified
            e("bse-budapest", "BUX", "BUX", "^BUX.BD"),                      // unverified
            e("bvb", "BET", "BET", null),                                    // no free feed known
            e("lux-se", "LUXX", "LuxX", null),                               // no free feed known

            // ---- North & South America ----
            e("nyse", "SPX", "S&P 500", "^GSPC"),
            e("nasdaq", "IXIC", "NASDAQ Composite", "^IXIC"),
            e("tsx", "GSPTSE", "S&P/TSX Composite", "^GSPTSE"),
            e("tsx-venture", "SPCDNX", "S&P/TSX Venture Composite", "^SPCDNX"), // unverified
            e("b3", "BVSP", "Bovespa", "^BVSP"),
            e("bmv", "MXX", "S&P/BMV IPC", "^MXX"),
            e("byma", "MERV", "S&P Merval", "^MERV"),
            e("santiago-se", "IPSA", "S&P CLX IPSA", "^IPSA"),
            e("bvc", "COLCAP", "MSCI COLCAP", "^COLCAP"),                    // unverified
            e("lima-se", "SPBLPGPT", "S&P/BVL Peru General", "^SPBLPGPT"),   // unverified
            e("jse-jamaica", "JMSE", "JSE Main Index", null),                // no free feed known

            // ---- Africa ----
            e("jse-southafrica", "J203", "FTSE/JSE All Share", "^J203.JO"),  // unverified
            e("ngx", "NGXASI", "NGX All-Share", null),                       // no free feed known
            e("egx", "EGX30", "EGX 30", "^CASE30"),
            e("nse-kenya", "NSE20", "NSE 20 Share", null),                   // no free feed known
            e("cse-casablanca", "MASI", "MASI", null),                       // no free feed known
            e("gse-ghana", "GSECI", "GSE Composite", null),                  // no free feed known
            e("sem-mauritius", "SEMDEX", "SEMDEX", null),                    // no free feed known
            e("bse-botswana", "DCI", "Domestic Company Index", null),        // no free feed known
            e("zse-zimbabwe", "ZSEALL", "ZSE All Share", null),              // no free feed known
            e("bvmt", "TUNINDEX", "TUNINDEX", null)                          // no free feed known
    );
}

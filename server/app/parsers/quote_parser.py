# -- filepath: server/app/parsers/quote_parser.py
def normalize_quote(q: dict):

    return {
        "symbol": q.get("symbol"),
        "name": q.get("name"),

        "price": {
            "current": q.get("current"),
            "change": q.get("chg"),
            "percent": q.get("percent"),
        },

        "market": {
            "open": q.get("open"),
            "high": q.get("high"),
            "low": q.get("low"),
            "last_close": q.get("last_close"),
            "volume": q.get("volume"),
            "amount": q.get("amount"),
            "turnover": q.get("turnover_rate"),
            "volume_ratio": q.get("volume_ratio"),
            "amplitude": q.get("amplitude"),
        },

        "valuation": {
            "pe_ttm": q.get("pe_ttm"),
            "pe_dynamic": q.get("pe_forecast"),
            "pe_static": q.get("pe_lyr"),
            "pb": q.get("pb"),
            "eps": q.get("eps"),
            "navps": q.get("navps"),
        },

        "shares": {
            "total_shares": q.get("total_shares"),
            "float_shares": q.get("float_shares"),
            "market_cap": q.get("market_capital"),
            "float_market_cap": q.get("float_market_capital"),
        },

        "week52": {
            "high": q.get("high52w"),
            "low": q.get("low52w"),
        },

        "meta": {
            "exchange": q.get("exchange"),
            "currency": q.get("currency"),
            "timestamp": q.get("timestamp"),
        }
    }
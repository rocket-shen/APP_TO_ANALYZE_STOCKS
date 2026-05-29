from src.services.fetchers import fetch_xq_quote
from src.parsers.quote_parser import normalize_quote

async def get_quote(symbol):

    raw = await fetch_xq_quote(symbol)

    quote = normalize_quote(raw)

    return quote
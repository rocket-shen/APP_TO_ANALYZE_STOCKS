WITH clean_symbol AS (
    SELECT 
        *,
        CASE
            WHEN symbol LIKE 'SH%' THEN SUBSTR(symbol, 3)
            WHEN symbol LIKE 'SZ%' THEN SUBSTR(symbol, 3)
            WHEN symbol LIKE 'BJ%' THEN SUBSTR(symbol, 3)
            ELSE symbol
        END AS clean_code
    FROM share_holders
    WHERE symbol = ? OR (
        CASE
            WHEN symbol LIKE 'SH%' THEN SUBSTR(symbol, 3)
            WHEN symbol LIKE 'SZ%' THEN SUBSTR(symbol, 3)
            WHEN symbol LIKE 'BJ%' THEN SUBSTR(symbol, 3)
            ELSE symbol
        END
    ) = ?
)
SELECT
    h.symbol AS symbol_raw,
    h.clean_code AS stock_code,
    h.stock_name,
	h.change_date,
    h.ashare_holder AS a_share_holders,
	h.holder_num,
	h.chg AS holders_chg,
    h.per_amount,
    h.per_float,
	h.per_float_chg,
	h.price,
    h.top_holder_ratio AS top10_ratio,
	h.top_float_holder_ratio AS top10_float_ratio,
    e.total_shares,
    e.tradable_shares,
    e.restricted_shares,
	ROUND(h.per_amount / NULLIF(h.per_float, 0), 2) AS avg_price
    
FROM clean_symbol h
LEFT JOIN shares_events e
    ON h.clean_code = e.stock_code
   AND e.change_date = (
        SELECT MAX(e2.change_date)
        FROM shares_events e2
        WHERE e2.stock_code = h.clean_code
          AND e2.change_date <= h.change_date
   )
WHERE h.change_date >= '2020-01-01'
ORDER BY h.change_date DESC;
SELECT
    h.symbol AS symbol_raw,
    CASE
        WHEN h.symbol LIKE 'SH%' THEN SUBSTR(h.symbol, 3)
        WHEN h.symbol LIKE 'SZ%' THEN SUBSTR(h.symbol, 3)
        WHEN h.symbol LIKE 'BJ%' THEN SUBSTR(h.symbol, 3)
        ELSE h.symbol
    END AS stock_code,
    h.stock_name,
    -- h.change_date AS holder_change_date,  -- 改为唯一别名
    h.ashare_holder,
	h.per_amount,
	h.per_float,
    h.top_holder_ratio,
    e.change_date AS event_change_date,   -- 改为唯一别名
    e.total_shares,
    e.tradable_shares,
    e.restricted_shares
FROM share_holders h
LEFT JOIN shares_events e
    ON (
        CASE
            WHEN h.symbol LIKE 'SH%' THEN SUBSTR(h.symbol, 3)
            WHEN h.symbol LIKE 'SZ%' THEN SUBSTR(h.symbol, 3)
            WHEN h.symbol LIKE 'BJ%' THEN SUBSTR(h.symbol, 3)
            ELSE h.symbol
        END
    ) = e.stock_code
   AND e.change_date = (
        SELECT MAX(e2.change_date)
        FROM shares_events e2
        WHERE e2.stock_code = (
            CASE
                WHEN h.symbol LIKE 'SH%' THEN SUBSTR(h.symbol, 3)
                WHEN h.symbol LIKE 'SZ%' THEN SUBSTR(h.symbol, 3)
                WHEN h.symbol LIKE 'BJ%' THEN SUBSTR(h.symbol, 3)
                ELSE h.symbol
            END
        )
          AND e2.change_date <= h.change_date
   )
WHERE (
    CASE
        WHEN h.symbol LIKE 'SH%' THEN SUBSTR(h.symbol, 3)
        WHEN h.symbol LIKE 'SZ%' THEN SUBSTR(h.symbol, 3)
        WHEN h.symbol LIKE 'BJ%' THEN SUBSTR(h.symbol, 3)
        ELSE h.symbol
    END
) = ?
ORDER BY h.change_date;
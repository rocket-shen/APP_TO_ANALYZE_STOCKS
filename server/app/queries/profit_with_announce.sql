SELECT
    code,
    report_date,
    announcement_date,
    net_profit
FROM profit_with_announcement
WHERE code = "000902"
    AND announcement_date >= '2016-12-31'
ORDER BY announcement_date
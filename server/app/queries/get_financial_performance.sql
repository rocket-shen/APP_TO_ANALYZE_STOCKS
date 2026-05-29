-- filepath: src/queries/get_financial_performance.sql
SELECT *
FROM financial_performance
WHERE code = :code
    AND report_date >= '2017-01-01'
    AND report_date LIKE '%-12-31'
ORDER BY report_date DESC;

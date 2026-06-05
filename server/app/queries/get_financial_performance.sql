-- filepath: src/queries/get_financial_performance.sql
SELECT *
FROM financial_performance
WHERE code = :code
    AND report_date >= '2017-01-01'
ORDER BY report_date DESC;

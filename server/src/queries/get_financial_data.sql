-- filepath: queries/get_financial_data.sql
SELECT *
FROM view_financial_data_industrial 
WHERE symbol = :symbol
    AND report_date >= '2017-01-01'
ORDER BY report_date DESC;
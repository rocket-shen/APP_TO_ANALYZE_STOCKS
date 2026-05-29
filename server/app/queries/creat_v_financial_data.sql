DROP VIEW IF EXISTS view_financial_data;
CREATE VIEW view_financial_data AS
WITH base_data AS (

    -- ① 统一解析 JSON（只解析一次）
    SELECT
        i.symbol,
        i.stock_name,
        i.report_date,

        -- 利润表
        CAST(json_extract(i.raw_json, '$.revenue[0]') AS REAL)              AS revenue,
        CAST(json_extract(i.raw_json, '$.revenue[1]') AS REAL)              AS revenue_yoy,
        CAST(json_extract(i.raw_json, '$.operating_cost[0]') AS REAL)       AS operating_cost,
        CAST(json_extract(i.raw_json, '$.operating_taxes_and_surcharge[0]') AS REAL)       AS operating_taxes_and_surcharge,
        CAST(json_extract(i.raw_json, '$.sales_fee[0]') AS REAL)       AS sales_fee,
        CAST(json_extract(i.raw_json, '$.manage_fee[0]') AS REAL)       AS manage_fee,
        CAST(json_extract(i.raw_json, '$.rad_cost[0]') AS REAL)       AS rad_cost,
        CAST(json_extract(i.raw_json, '$.financial_expense[0]') AS REAL)    AS financial_expense,

        CAST(json_extract(i.raw_json, '$.net_profit[0]') AS REAL)           AS net_profit,
        CAST(json_extract(i.raw_json, '$.net_profit[1]') AS REAL)           AS net_profit_yoy,
        CAST(json_extract(i.raw_json, '$.net_profit_atsopc[0]') AS REAL)    AS net_profit_atsopc,
        CAST(json_extract(i.raw_json, '$.asset_impairment_loss[0]') AS REAL)    AS asset_impairment_loss,
        CAST(json_extract(i.raw_json, '$.credit_impairment_loss[0]') AS REAL)    AS credit_impairment_loss,

        -- 资产负债表
        CAST(json_extract(b.raw_json, '$.asset_liab_ratio[0]') AS REAL)     AS asset_liab_ratio_raw,
        CAST(json_extract(b.raw_json, '$.total_quity_atsopc[0]') AS REAL)   AS total_quity_atsopc,
        CAST(json_extract(b.raw_json, '$.total_current_assets[0]') AS REAL) AS total_current_assets,
        CAST(json_extract(b.raw_json, '$.currency_funds[0]') AS REAL)       AS currency_funds,
		CAST(json_extract(b.raw_json, '$.total_current_liab[0]') AS REAL)   AS total_current_liab,
        CAST(json_extract(b.raw_json, '$.inventory[0]') AS REAL)            AS inventory,
        CAST(json_extract(b.raw_json, '$.ar_and_br[0]') AS REAL)            AS ar_and_br,
		CAST(json_extract(b.raw_json, '$.contractual_assets[0]') AS REAL)   AS contractual_assets,
		CAST(json_extract(b.raw_json, '$.total_liab[0]') AS REAL)           AS total_liab,
		CAST(json_extract(b.raw_json, '$.total_assets[0]') AS REAL)         AS total_assets,

        -- 现金流量表
        CAST(json_extract(c.raw_json, '$.ncf_from_oa[0]') AS REAL)          AS net_cash_flow_operating,

        -- 新增：销售商品提供劳务收到的现金
        CAST(json_extract(c.raw_json, '$.cash_received_of_sales_service[0]') AS REAL) AS cash_from_sales,

        -- 新增：购买商品接受劳务支付的现金
        CAST(json_extract(c.raw_json, '$.goods_buy_and_service_cash_pay[0]') AS REAL)     AS cash_paid_for_goods,
        
        -- 新增：购建固定资产等支付的现金 (Capital Expenditure)
        CAST(json_extract(c.raw_json, '$.cash_paid_for_assets[0]') AS REAL)          AS cash_paid_for_assets

        -- 新增：处置固定资产、无形资产和其他长期资产收回的现金净额 (Capital Expenditure)
        CAST(json_extract(c.raw_json, '$.net_cash_of_disposal_assets[0]') AS REAL) AS net_cash_of_disposal_assets

    FROM income_sheet i
    JOIN balance_sheet b
        ON i.symbol = b.symbol AND i.report_date = b.report_date
    JOIN cash_sheet c
        ON i.symbol = c.symbol AND i.report_date = c.report_date
),

financial_ratios AS (

    -- ② 计算财务比率（避免重复 JSON）
    SELECT
        *,

        -- 资产负债率
        ROUND(asset_liab_ratio_raw * 100, 2) AS asset_liab_ratio,

        -- ROE
        CASE 
            WHEN total_quity_atsopc > 0 
            THEN ROUND(net_profit_atsopc / total_quity_atsopc * 100, 2)
        END AS roe,

        -- 毛利率
        CASE 
            WHEN revenue > 0 
            THEN ROUND((revenue - operating_cost) / revenue * 100, 2)
        END AS gross_margin,

        -- 核心利润
        ROUND(revenue - operating_cost - operating_taxes_and_surcharge - sales_fee - manage_fee - rad_cost - financial_expense, 2) AS core_profit,

        -- 净利率
        CASE 
            WHEN revenue > 0 
            THEN ROUND(net_profit / revenue * 100, 2)
        END AS net_profit_margin,

        --  自由现金流 (经营现金流 - 资本支出)
        ROUND(net_cash_flow_operating - COALESCE(cash_paid_for_assets, 0) + COALESCE(net_cash_of_disposal_assets, 0), 2) AS free_cash_flow,

        --  收现比 (销售商品收到的现金 / 营业收入)
        CASE WHEN revenue > 0 THEN ROUND(cash_from_sales / revenue, 4) END AS cash_received_ratio,

        --  付现比 (购买商品支付的现金 / 营业成本)
        CASE WHEN operating_cost > 0 THEN ROUND(cash_paid_for_goods / operating_cost, 4) END AS cash_paid_ratio,

        -- 流动比率
        CASE 
            WHEN total_current_liab > 0 
            THEN ROUND(total_current_assets / total_current_liab, 2)
        END AS current_ratio,

        -- 速动比率
        CASE 
            WHEN total_current_liab > 0 
            THEN ROUND((total_current_assets - COALESCE(inventory,0)) / total_current_liab, 2)
        END AS quick_ratio,

        -- 应收账款周转率
        CASE 
            WHEN ar_and_br > 0 
            THEN ROUND(revenue / ar_and_br, 2)
        END AS ar_turnover,

        -- 存货周转率
        CASE 
            WHEN inventory > 0 
            THEN ROUND(operating_cost / inventory, 2)
        END AS inventory_turnover

    FROM base_data
)

SELECT * FROM financial_ratios;
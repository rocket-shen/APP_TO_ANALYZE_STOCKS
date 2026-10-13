DROP VIEW IF EXISTS view_financial_data_industrial;
CREATE VIEW view_financial_data_industrial AS
WITH base_data AS (
    SELECT
        i.symbol,
        i.stock_name,
        i.report_date,

        -- 利润表 (income1)
        CAST(json_extract(i.raw_json, '$.total_revenue[0]') AS REAL)         AS total_revenue,
        CAST(json_extract(i.raw_json, '$.revenue[0]') AS REAL)               AS revenue,
        CAST(json_extract(i.raw_json, '$.revenue[1]') AS REAL)               AS revenue_yoy,
        CAST(json_extract(i.raw_json, '$.operating_costs[0]') AS REAL)       AS operating_costs,
        CAST(json_extract(i.raw_json, '$.operating_cost[0]') AS REAL)        AS operating_cost,
        CAST(json_extract(i.raw_json, '$.operating_taxes_and_surcharge[0]') AS REAL) AS operating_taxes_and_surcharge,
        CAST(json_extract(i.raw_json, '$.sales_fee[0]') AS REAL)             AS sales_fee,
        CAST(json_extract(i.raw_json, '$.manage_fee[0]') AS REAL)            AS manage_fee,
        CAST(json_extract(i.raw_json, '$.rad_cost[0]') AS REAL)              AS rad_cost,
        CAST(json_extract(i.raw_json, '$.financing_expenses[0]') AS REAL)    AS financing_expenses,
        CAST(json_extract(i.raw_json, '$.finance_cost_interest_fee[0]') AS REAL)    AS finance_cost_interest_fee,
        CAST(json_extract(i.raw_json, '$.profit_total_amt[0]') AS REAL)    AS profit_total_amt,
        CAST(json_extract(i.raw_json, '$.net_profit[0]') AS REAL)            AS net_profit,
        CAST(json_extract(i.raw_json, '$.net_profit[1]') AS REAL)            AS net_profit_yoy,
        CAST(json_extract(i.raw_json, '$.net_profit_atsopc[0]') AS REAL)     AS net_profit_atsopc,
        CAST(json_extract(i.raw_json, '$.asset_impairment_loss[0]') AS REAL) AS asset_impairment_loss,
        CAST(json_extract(i.raw_json, '$.credit_impairment_loss[0]') AS REAL) AS credit_impairment_loss,

        -- 资产负债表 (balance1)
        CAST(json_extract(b.raw_json, '$.total_assets[0]') AS REAL)          AS total_assets,
        CAST(json_extract(b.raw_json, '$.total_liab[0]') AS REAL)            AS total_liab,
        CAST(json_extract(b.raw_json, '$.total_quity_atsopc[0]') AS REAL)    AS total_quity_atsopc,
        CAST(json_extract(b.raw_json, '$.total_current_assets[0]') AS REAL)  AS total_current_assets,
        CAST(json_extract(b.raw_json, '$.total_current_liab[0]') AS REAL)    AS total_current_liab,
        CAST(json_extract(b.raw_json, '$.currency_funds[0]') AS REAL)        AS currency_funds,
        CAST(json_extract(b.raw_json, '$.tradable_fnncl_assets[0]') AS REAL) AS tradable_fnncl_assets,
        CAST(json_extract(b.raw_json, '$.inventory[0]') AS REAL)             AS inventory,
        CAST(json_extract(b.raw_json, '$.ar_and_br[0]') AS REAL)             AS ar_and_br,
        CAST(json_extract(b.raw_json, '$.contractual_assets[0]') AS REAL)    AS contractual_assets,
        CAST(json_extract(b.raw_json, '$.pre_payment[0]') AS REAL)           AS pre_payment,
        CAST(json_extract(b.raw_json, '$.bp_and_ap[0]') AS REAL)             AS bp_and_ap,
        CAST(json_extract(b.raw_json, '$.pre_receivable[0]') AS REAL)         AS pre_receivable,
        CAST(json_extract(b.raw_json, '$.contract_liabilities[0]') AS REAL)  AS contract_liabilities,
        CAST(json_extract(b.raw_json, '$.st_loan[0]') AS REAL)               AS st_loan,
        CAST(json_extract(b.raw_json, '$.lt_loan[0]') AS REAL)               AS lt_loan,            -- 长期借款

        -- 🌟 新增/完善资产状况与有息负债底层字段
        CAST(json_extract(b.raw_json, '$.fixed_asset_sum[0]') AS REAL)          AS fixed_asset_sum,       -- 固定资产
        CAST(json_extract(b.raw_json, '$.intangible_assets[0]') AS REAL)    AS intangible_assets, -- 无形资产
        CAST(json_extract(b.raw_json, '$.bond_payable[0]') AS REAL)          AS bond_payable,       -- 应付债券
        CAST(json_extract(b.raw_json, '$.noncurrent_liab_due_in1y[0]') AS REAL) AS noncurrent_liab_due_in1y, -- 一年内到期的非流动负债

        -- 现金流量表 (cash1)
        CAST(json_extract(c.raw_json, '$.ncf_from_oa[0]') AS REAL)           AS net_cash_flow_operating,
        CAST(json_extract(c.raw_json, '$.cash_received_of_sales_service[0]') AS REAL) AS cash_from_sales,
        CAST(json_extract(c.raw_json, '$.goods_buy_and_service_cash_pay[0]') AS REAL) AS cash_paid_for_goods,
        CAST(json_extract(c.raw_json, '$.cash_paid_for_assets[0]') AS REAL)   AS cash_paid_for_assets,
        CAST(json_extract(c.raw_json, '$.net_cash_of_disposal_assets[0]') AS REAL) AS net_cash_of_disposal_assets

    FROM income_sheet i
    JOIN balance_sheet b ON i.symbol = b.symbol AND i.report_date = b.report_date
    JOIN cash_sheet c ON i.symbol = c.symbol AND i.report_date = c.report_date
),

lag_data AS (
    -- ② 利用窗口函数获取上期（期初）时点值，用于计算平均资产/平均存货/平均应收
    -- 特别注意：在多季度分析时，利用 LAG 建立同股票、按时间排序的链条
    SELECT
        *,
        LAG(total_quity_atsopc) OVER (PARTITION BY symbol ORDER BY report_date) AS prev_total_quity_atsopc,
        LAG(ar_and_br) OVER (PARTITION BY symbol ORDER BY report_date)          AS prev_ar_and_br,
        LAG(inventory) OVER (PARTITION BY symbol ORDER BY report_date)         AS prev_inventory
    FROM base_data
),

financial_indicators AS (
    -- ③ 核心指标、修正指标与新增维度计算
    SELECT
        symbol,
        stock_name,
        report_date,
        
        -- [基础指标]
        total_revenue,
        revenue,
        revenue_yoy,
        net_profit,
        net_profit_yoy,
        net_profit_atsopc,
        profit_total_amt,
        inventory, 
        ar_and_br,
        total_assets,
        total_liab,
        total_current_assets,
        total_current_liab,
        currency_funds,
        tradable_fnncl_assets,
        net_cash_flow_operating,
        asset_impairment_loss,
        credit_impairment_loss,

        -- 🌟 [资产重轻结构透视明细]
        COALESCE(fixed_asset_sum, 0)       AS fixed_asset_sum,       -- 固定资产
        COALESCE(intangible_assets, 0)  AS intangible_assets,  -- 无形资产

        -- 🌟 [有息负债汇总]
        -- 有息负债 = 短期借款 + 一年内到期的非流动负债 + 长期借款 + 应付债券
        ROUND(
            COALESCE(st_loan, 0) + 
            COALESCE(noncurrent_liab_due_in1y, 0) + 
            COALESCE(lt_loan, 0) + 
            COALESCE(bond_payable, 0)
        , 2) AS interest_bearing_liab,

        -- [结构修正：资产负债率]
        CASE 
            WHEN total_assets > 0 THEN ROUND((total_liab / total_assets) * 100, 2)
        END AS asset_liab_ratio,

        -- [精确修正：ROE（使用平均股东权益）]
        CASE 
            WHEN total_quity_atsopc > 0 AND prev_total_quity_atsopc > 0 
            THEN ROUND(net_profit_atsopc / ((total_quity_atsopc + prev_total_quity_atsopc) / 2) * 100, 2)
            -- 若无可比上期数据，降级使用期末值兜底
            WHEN total_quity_atsopc > 0 THEN ROUND(net_profit_atsopc / total_quity_atsopc * 100, 2)
        END AS roe,

        -- [盈利能力]
        CASE 
            WHEN revenue > 0 THEN ROUND((revenue - operating_cost) / revenue * 100, 2)
        END AS gross_margin,

        CASE 
            WHEN revenue > 0 THEN ROUND(net_profit / revenue * 100, 2)
        END AS net_profit_margin,

        -- 核心利润
        ROUND(revenue - operating_cost - operating_taxes_and_surcharge - sales_fee - manage_fee - rad_cost - COALESCE(financing_expenses, 0), 2) AS core_profit,

        -- [严格口径自由现金流：经营现金流 - 资本支出]
        ROUND(net_cash_flow_operating - COALESCE(cash_paid_for_assets, 0), 2) AS free_cash_flow,

        -- [现金流质量]
        CASE WHEN revenue > 0 THEN ROUND(cash_from_sales / revenue, 4) END AS cash_received_ratio,
        CASE WHEN operating_cost > 0 THEN ROUND(cash_paid_for_goods / operating_cost, 4) END AS cash_paid_ratio,

        -- [盈利质量：净现比]
        CASE
            WHEN net_profit IS NOT NULL AND net_profit != 0
            THEN ROUND(net_cash_flow_operating / net_profit, 4)
        END AS cash_earnings_ratio,

        -- [偿债能力（流动与速动）]
        CASE WHEN total_current_liab > 0 THEN ROUND(total_current_assets / total_current_liab, 2) END AS current_ratio,
        CASE WHEN total_current_liab > 0 THEN ROUND((total_current_assets - COALESCE(inventory, 0)) / total_current_liab, 2) END AS quick_ratio,

        -- [现金比率：货币资金 + 交易性金融资产] / 流动负债
        CASE
            WHEN total_current_liab > 0
            THEN ROUND((COALESCE(currency_funds, 0) + COALESCE(tradable_fnncl_assets, 0)) / total_current_liab, 2)
        END AS cash_ratio,

        -- [精确修正：应收账款周转率（使用平均应收账款）]
        CASE 
            WHEN ar_and_br > 0 AND prev_ar_and_br > 0 THEN ROUND(revenue / ((ar_and_br + prev_ar_and_br) / 2), 2)
            WHEN ar_and_br > 0 THEN ROUND(revenue / ar_and_br, 2)
        END AS ar_turnover,

        -- [精确修正：存货周转率（使用平均存货）]
        CASE 
            WHEN inventory > 0 AND prev_inventory > 0 THEN ROUND(operating_cost / ((inventory + prev_inventory) / 2), 2)
            WHEN inventory > 0 THEN ROUND(operating_cost / inventory, 2)
        END AS inventory_turnover,

        -- [报告期天数：按季报/半年报/三季报/年报映射，非一律 365]
        CASE
            WHEN substr(report_date, 6, 5) = '03-31' THEN 90
            WHEN substr(report_date, 6, 5) = '06-30' THEN 181
            WHEN substr(report_date, 6, 5) = '09-30' THEN 273
            WHEN substr(report_date, 6, 5) = '12-31' THEN 365
            ELSE 90
        END AS period_days,

        ----------------------------------------------------
        -- 🔥以下为新增的核心风险与安全垫分析维度🔥
        ----------------------------------------------------

        -- 1. 资产质量：减值损失占利润总额比重
        CASE
            WHEN profit_total_amt IS NOT NULL AND profit_total_amt != 0
            THEN ROUND(
                (COALESCE(asset_impairment_loss, 0) + COALESCE(credit_impairment_loss, 0))
                / profit_total_amt * 100
            , 2)
        END AS impairment_to_profit_ratio,

        -- 2. 短期防爆雷：现金短期债务比 (硬通货对短期有息负债的覆盖程度)
        CASE 
            WHEN st_loan > 0 THEN ROUND(currency_funds / (st_loan + noncurrent_liab_due_in1y), 2)
            WHEN st_loan = 0 THEN 999.99 -- 无短期借款，处于绝对安全状态
        END AS cash_to_st_debt_ratio,

        -- 3. 产业链话语权：上下游资金占用差额 (下游无息负债 - 上游无息资产)
        -- 差额若为正，说明企业靠“白嫖”上下游账期做大业务，具备强势护城河
        ROUND(
            (COALESCE(bp_and_ap, 0) + COALESCE(pre_receivable, 0) + COALESCE(contract_liabilities, 0)) -- 占下游的钱 (应付+预收)
            - 
            (COALESCE(ar_and_br, 0) + COALESCE(contractual_assets, 0) + COALESCE(pre_payment, 0)) -- 被上游占的钱 (应收+合同资产+预付)
        , 2) AS net_supply_chain_capital_occupied,

        -- 4. 利息保障倍数（EBITDA / 利息费用），衡量盈利对利息的覆盖能力，越高越安全
        CASE 
            WHEN finance_cost_interest_fee > 0 THEN ROUND((profit_total_amt + finance_cost_interest_fee) / finance_cost_interest_fee, 2)
            ELSE NULL
        END AS interest_coverage_ratio

    FROM lag_data
)

-- 周转天数依赖同层别名 ar_turnover / inventory_turnover，故在外层派生
SELECT
    fi.*,
    CASE
        WHEN ar_turnover IS NOT NULL AND ar_turnover > 0
        THEN ROUND(period_days * 1.0 / ar_turnover, 2)
    END AS ar_turnover_days,
    CASE
        WHEN inventory_turnover IS NOT NULL AND inventory_turnover > 0
        THEN ROUND(period_days * 1.0 / inventory_turnover, 2)
    END AS inventory_turnover_days,
    CASE
        WHEN (ar_turnover IS NOT NULL AND ar_turnover > 0)
             AND (inventory_turnover IS NOT NULL AND inventory_turnover > 0)
        THEN ROUND(
            (period_days * 1.0 / ar_turnover)
            + (period_days * 1.0 / inventory_turnover)
        , 2)
    END AS operating_cycle
FROM financial_indicators fi;

CREATE TABLE share_holders (
    symbol TEXT NOT NULL,                    -- 股票代码
    change_date TEXT NOT NULL,               -- 变动日期，格式 %Y-%m-%d
    stock_name TEXT NOT NULL,                -- 股票名称
    ashare_holder INTEGER,                   -- A股股东数（A股股东户数）
    bshare_holder INTEGER,                   -- B股股东数（B股股东户数）
    chg REAL,                                -- 涨跌幅
    holder_num INTEGER,                      -- 股东总数（股东总户数）
    hshare_holder INTEGER,                   -- H股股东数（H股股东户数）
    per_amount REAL,                         -- 人均持股市值（人均持股金额）
    per_float REAL,                          -- 人均流通股数（人均持股数量）
    per_float_chg REAL,                      -- 人均流通股数变动（人均持股变动幅度）
    price REAL,                              -- 股价（最新价）
    timestamp TEXT,                          -- 时间戳（数据统计日期/时间）
    top_float_holder_ratio REAL,             -- 前十大流通股东持股比例（占比）
    top_holder_ratio REAL,                   -- 前十大股东持股比例（占比）
    PRIMARY KEY (symbol, change_date)
);
import time
import httpx
import logging
import json
from datetime import datetime
from utilis.xq_cookies import XueqiuCookieManager
import pandas as pd
from utilis.tools import load_financial_config

FIELD_MAP = load_financial_config()

logger = logging.getLogger(__name__)

def get_field_mapping(org_type: int, report_type: str) -> dict:
    """
    根据 org_type 和 report_type 获取对应的中文字段映射
    """
    if report_type == "income":
        if org_type == 1:
            return FIELD_MAP["income1"]
        elif org_type == 2:
            return FIELD_MAP["income2"]
        elif org_type == 3:
            return FIELD_MAP["income3"]
        elif org_type == 4:
            return FIELD_MAP["income4"]
        else:
            return FIELD_MAP["income1"]  # 默认使用一般企业

    elif report_type == "balance":
        if org_type == 1:
            return FIELD_MAP["balance1"]
        elif org_type == 2:
            return FIELD_MAP["balance2"]
        elif org_type == 3:
            return FIELD_MAP["balance3"]
        elif org_type == 4:
            return FIELD_MAP["balance4"]
        else:
            return FIELD_MAP["balance1"]

    elif report_type == "cash_flow":
        if org_type == 1:
            return FIELD_MAP["cash1"]
        elif org_type == 2:
            return FIELD_MAP["cash2"]
        elif org_type == 3:
            return FIELD_MAP["cash3"]
        elif org_type == 4:
            return FIELD_MAP["cash4"]
        else:
            return FIELD_MAP["cash1"]

    return {}


async def download_report(symbol: str, report_type: str) -> pd.DataFrame:
    """
    通用雪球财报抓取器
    
    :param symbol: 股票代码 (需带前缀，如 SH600519)
    :param report_type: 报表类型 ('balance', 'cash_flow', 'income')
    :return: 清洗后的数据列表
    """
    
    # 1. 映射 URL
    url_map = {
        "balance": "https://stock.xueqiu.com/v5/stock/finance/cn/balance.json",
        "cash_flow": "https://stock.xueqiu.com/v5/stock/finance/cn/cash_flow.json",
        "income": "https://stock.xueqiu.com/v5/stock/finance/cn/income.json"
    }
    
    url = url_map.get(report_type)
    if not url:
        raise ValueError(f"不支持的报表类型: {report_type}")

    # 2. 准备请求参数
    params = {
        "symbol": symbol.upper(),
        "type": "all",
        "is_detail": "true",
        "count": "40",
        "timestamp": int(round(time.time() * 1000))
    }

    async with httpx.AsyncClient(timeout=15.0) as client:
        try:
            # 3. 获取并注入 Cookie
            cookie_str = await XueqiuCookieManager.get_cookie(client)
            headers = {
                **XueqiuCookieManager.HEADERS,
                "Cookie": cookie_str,
                "Referer": "https://xueqiu.com/"
            }

            # 4. 发起请求
            resp = await client.get(url, headers=headers, params=params)
            resp.raise_for_status()
            
            payload = resp.json().get("data", {})
            data_list = payload.get("list", [])

            org_type = payload.get("org_type", 1)  # 默认1=一般企业
            quote_name = payload.get("quote_name", "未知")

            for item in data_list:
                if 'report_date' in item:
                    item['report_date'] = datetime.fromtimestamp(item['report_date'] / 1000).strftime('%Y-%m-%d')
            df = pd.DataFrame(data_list)

            # 只取包含列表的字段的第一个值
            df = df.map(lambda x: x[0] if isinstance(x, list) else x)

            field_mapping = get_field_mapping(org_type, report_type)
        
            # 只映射存在的列
            rename_dict = {eng: chn for eng, chn in field_mapping.items() if eng in df.columns}
            df.rename(columns=rename_dict, inplace=True)
            desired_order = [chn for eng, chn in field_mapping.items() if eng in rename_dict]
            df = df.reindex(columns=desired_order)

            logger.info(f"成功抓取 {symbol} - {report_type}: {len(data_list)} 条记录")

            return {
                'df': df,
                'org_type': org_type,
                'quote_name': quote_name,
                'report_type': report_type
            }
        

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP错误 {e.response.status_code}: {symbol} - {report_type}")
            raise
        except Exception as e:
            logger.error(f"解析错误 {symbol} - {report_type}: {str(e)}")
            raise

import os
import asyncio
from datetime import datetime
import openpyxl
from openpyxl.styles import Font

async def save_financial_reports_to_excel(symbol: str, folder_path: str = 'D:/雪球数据/个股财务报表'):
    """
    抓取并保存财报到 Excel，文件名包含 quote_name
    """
    # 1. 先抓取数据，获取 quote_name
    balance_result = await download_report(symbol, "balance")
    income_result = await download_report(symbol, "income")
    cash_result = await download_report(symbol, "cash_flow")

    # 使用 balance 中的 quote_name（三个报表应该一致）
    quote_name = balance_result.get('quote_name', '未知公司')
    org_type = balance_result.get('org_type', 1)
    
    # 清理公司名称中的非法字符（避免文件名错误）
    clean_quote_name = "".join([c if c.isalnum() or c in "（）()_-" else "_" for c in quote_name])
    
    # 当前日期
    current_date = datetime.now().strftime('%Y%m%d')
    
    # 2. 构造文件名和完整路径
    file_name = f"{symbol}_{clean_quote_name}_财务数据_{current_date}.xlsx"
    file_path = os.path.join(folder_path, file_name)
    
    # 3. 确保文件夹存在
    os.makedirs(folder_path, exist_ok=True)
    
    # 4. 保存 Excel
    with pd.ExcelWriter(file_path, engine='openpyxl') as writer:
        results = [balance_result, income_result, cash_result]
        
        for result in results:
            if isinstance(result, Exception):
                logger.error(f"抓取失败: {result}")
                continue
                
            df = result['df']
            report_type = result['report_type']
            
            # Sheet 名称（中文）
            sheet_name_map = {
                "balance": "资产负债表",
                "income": "利润表",
                "cash_flow": "现金流量表"
            }
            sheet_name = sheet_name_map.get(report_type, report_type)
            
            # 写入数据
            df.to_excel(writer, sheet_name=sheet_name, index=False)
            
            # 在第一行插入标题（美观）
            worksheet = writer.sheets[sheet_name]
            title = f"{symbol} {quote_name} - {sheet_name} （组织类型: {org_type}）"
            
            worksheet.insert_rows(1)
            cell = worksheet['A1']
            cell.value = title
            cell.font = Font(bold=True, size=14)

    logger.info(f"✅ 文件保存成功！\n路径: {file_path}")
    print(f"文件已保存：{file_path}")
    
    return file_path


async def main():
    symbol = "SH600210"   # 示例：贵州茅台
    
    file_path = await save_financial_reports_to_excel(
        symbol=symbol,
        folder_path='D:/雪球数据/个股财务报表'
    )

asyncio.run(main())
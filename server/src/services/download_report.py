import time
import httpx
import logging
import json
from datetime import datetime
from utilis.xq_cookies import XueqiuCookieManager
import pandas as pd
from utilis.tools import load_financial_config
from config.config import settings
import aiosqlite

FIELD_MAP = json.loads(settings.FINANCIAL_FIELDS_JSON.read_text(encoding="utf-8"))

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


async def get_financial_reports_from_db(symbol: str, db_path: str) -> dict:
    """
    从数据库获取财报数据（可处理多个财报类型）
    
    :param symbol: 股票代码
    :param db_path: 数据库路径
    :return: 返回格式 {
        'balance': {'df': DataFrame, 'org_type': int, 'quote_name': str},
        'income': {...},
        'cash_flow': {...}
    }
    """
    # 新增检查
    if not os.path.exists(db_path):
        logger.error(f"数据库文件不存在: {os.path.abspath(db_path)}")
        raise FileNotFoundError(f"找不到数据库文件: {db_path}")
    # 映射表名和report_type
    table_map = {
        "balance": "balance_sheet",
        "income": "income_sheet",
        "cash_flow": "cash_sheet"
    }
    
    results = {}
    
    try:
        async with aiosqlite.connect(db_path) as db:
            # 设置为字典模式，方便处理 JSON 数据
            db.row_factory = aiosqlite.Row
            
            for report_type, table_name in table_map.items():
                try:
                    # 从数据库查询数据
                    query = f"""
                        SELECT raw_json, stock_name 
                        FROM {table_name} 
                        WHERE symbol = ? 
                        ORDER BY report_date DESC
                    """
                    
                    cursor = await db.execute(query, (symbol,))
                    rows = await cursor.fetchall()
                    
                    if not rows:
                        logger.warning(f"数据库中未找到 {symbol} 的 {report_type} 数据")
                        results[report_type] = None
                        continue
                    
                    # 解析 JSON 数据并转换为 DataFrame
                    data_list = []
                    stock_name = None
                    
                    for row in rows:
                        raw_data = json.loads(row['raw_json'])
                        data_list.append(raw_data)
                        if stock_name is None:
                            stock_name = row['stock_name']
                    
                    df = pd.DataFrame(data_list)
                    df = df.map(lambda x: x[0] if isinstance(x, list) else x)
                    
                    # 获取字段映射并重命名列
                    # 需要从 raw_json 中提取 org_type（或使用默认值）
                    org_type = 1
                    if data_list:
                        org_type = data_list[0].get('org_type', 1)
                    
                    field_mapping = get_field_mapping(org_type, report_type)
                    
                    # 只映射存在的列
                    rename_dict = {eng: chn for eng, chn in field_mapping.items() if eng in df.columns}
                    df.rename(columns=rename_dict, inplace=True)
                    desired_order = [chn for eng, chn in field_mapping.items() if eng in rename_dict]
                    df = df.reindex(columns=desired_order)
                    
                    results[report_type] = {
                        'df': df,
                        'org_type': org_type,
                        'quote_name': stock_name or '未知公司',
                        'report_type': report_type
                    }
                    
                    logger.info(f"从数据库读取 {symbol} - {report_type}: {len(data_list)} 条记录")
                    
                except Exception as e:
                    logger.error(f"读取表 {table_name} 时出错: {str(e)}")
                    results[report_type] = None
        
        return results
        
    except Exception as e:
        logger.error(f"数据库连接错误 {symbol}: {str(e)}")
        raise


async def save_financial_reports_to_excel(
    symbol: str, 
    db_path: str,
    folder_path: str = 'D:/雪球数据/个股财务报表',
    use_db: bool = True
):
    """
    保存财报到 Excel，支持从数据库或实时抓取
    
    :param symbol: 股票代码
    :param db_path: 数据库路径
    :param folder_path: Excel 文件保存目录
    :param use_db: 是否使用数据库数据（True=从DB读取，False=实时抓取）
    """
    
    try:
        # 选择数据源
        if use_db:
            logger.info(f"从数据库获取 {symbol} 的财报数据...")
            results_dict = await get_financial_reports_from_db(symbol, db_path)
            
            # 转换格式以兼容后续代码
            balance_result = results_dict.get('balance')
            income_result = results_dict.get('income')
            cash_result = results_dict.get('cash_flow')
            
            # 检查是否成功获取数据
            if not balance_result:
                logger.error(f"无法从数据库获取 {symbol} 的财报数据")
                raise ValueError(f"数据库中找不到 {symbol} 的财报数据，请先同步数据")
        else:
            logger.info(f"实时抓取 {symbol} 的财报数据...")
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
                if result is None or isinstance(result, Exception):
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

    except Exception as e:
        logger.error(f"保存 Excel 失败 {symbol}: {str(e)}")
        raise


async def main():
    symbol = "SH600096"   
    
    # 从数据库读取数据
    file_path = await save_financial_reports_to_excel(
        symbol=symbol,
        db_path=settings.DB_PATH,
        folder_path=settings.DEFAULT_EXPORT_DIR,
        use_db=True  # 从数据库读取
    )

if __name__ == "__main__":
    asyncio.run(main())
import sqlite3
from pathlib import Path
import pandas as pd
import json
from typing import Optional
import logging
from datetime import datetime
from app.core.config import settings

logger = logging.getLogger(__name__)

SQL_DIR = settings.SQL_DIR
DB_PATH = settings.DB_PATH
OUTPUT_JSON_DIR = settings.OUTPUT_JSON_DIR

def load_queries(sql_dir=SQL_DIR) -> dict:
    """在新結構中載入所有 SQL 模板"""
    queries = {}
    

    if not sql_dir.exists():
        logger.warning(f"⚠️ SQL 目錄不存在: {sql_dir}")
        return queries

    for sql_file in sql_dir.glob("*.sql"):
        try:
            queries[sql_file.stem] = sql_file.read_text(encoding="utf-8")
            logger.info(f"✅ 已載入 SQL 模板: {sql_file.stem}")
        except Exception as e:
            logger.error(f"❌ 載入 {sql_file.name} 失敗: {e}")

    logger.info(f"總共載入 {len(queries)} 個 SQL 模板")
    return queries


def execute_query(sql: str, symbol: str, db_path: Optional[str | Path] = None) -> Optional[str]:
    """
    执行SQL查询并返回JSON格式结果
    
    Args:
        sql: SQL查询语句（包含 ? 占位符）
        symbol: 股票代码参数
        db_path: 数据库路径，默认使用 settings.DB_PATH
    
    Returns:
        JSON格式的查询结果，失败返回 None
    """
    if db_path is None:
        db_path = str(DB_PATH)
    else:
        db_path = str(db_path)
    
    conn = None
    try:
        conn = sqlite3.connect(db_path)
        logger.info(f"🔍 执行查询，参数: {symbol}")
        
        # 使用 pandas 读取 SQL
        df = pd.read_sql_query(sql, conn, params=(symbol,symbol))
        
        if df.empty:
            logger.warning(f"⚠️ 查询无结果，参数: {symbol}")
            return json.dumps([], ensure_ascii=False)  # 返回空数组
        
        # 转换为 JSON
        json_data = df.to_json(orient='records', force_ascii=False, indent=2)
        logger.info(f"✅ 查询成功，共 {len(df)} 条记录")
        
        return json_data
        
    except sqlite3.Error as e:
        logger.error(f"❌ 数据库错误: {e}")
        return None
    except Exception as e:
        logger.error(f"❌ 查询执行失败: {e}")
        return None
    finally:
        if conn:
            conn.close()


def save_json(json_data: str, symbol: str) -> Optional[str]:
    """
    保存JSON数据到文件
    
    Args:
        json_data: JSON字符串
        template_name: SQL模板名称
        symbol: 股票代码
    
    Returns:
        保存的文件路径，失败返回None
    """
    try:
        # 创建输出目录
        output_dir = Path(OUTPUT_JSON_DIR)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        filename = f"{symbol}_share_holders.json"
        filepath = output_dir / filename
        
        # 保存文件
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(json_data)
        
        logger.info(f"✅ 数据已保存: {filepath}")
        return str(filepath)
        
    except Exception as e:
        logger.error(f"❌ 保存文件失败: {e}")
        return None
    

def interactive_query():
    """交互式查询主函数"""
    print("\n" + "="*60)
    print("📊 SQL 查询工具")
    print("="*60)
    
    # 1. 加载SQL模板
    print("\n📂 正在加载SQL模板...")
    queries = load_queries()
    
    if not queries:
        print("❌ 没有找到任何SQL模板，请检查SQL目录")
        return
    
    # 2. 显示所有模板
    print("\n📋 已加载的 SQL 模板列表:")
    template_list = list(queries.keys())
    for idx, name in enumerate(template_list, 1):
        # 显示模板的前几行作为预览
        sql_preview = queries[name].split('\n')[:3]
        preview_text = ' '.join([line.strip() for line in sql_preview if line.strip()])
        if len(preview_text) > 60:
            preview_text = preview_text[:60] + "..."
        print(f"  {idx:2d}. {name:20s} - {preview_text}")
    
    # 3. 选择模板
    while True:
        try:
            choice = input(f"\n🔢 请选择模板编号 (1-{len(template_list)}): ").strip()
            idx = int(choice)
            if 1 <= idx <= len(template_list):
                template_name = template_list[idx - 1]
                break
            else:
                print(f"❌ 请输入 1 到 {len(template_list)} 之间的数字")
        except ValueError:
            print("❌ 请输入有效的数字")
        except KeyboardInterrupt:
            print("\n\n👋 已取消操作")
            return
    
    # 4. 输入股票代码
    while True:
        try:
            symbol = input("\n📈 请输入股票代码 (如: 600519): ").strip()
            if symbol:
                break
            else:
                print("❌ 股票代码不能为空")
        except KeyboardInterrupt:
            print("\n\n👋 已取消操作")
            return
    
    # 5. 执行查询
    print(f"\n⏳ 正在执行查询...")
    sql = queries[template_name]
    json_data = execute_query(sql, symbol)
    
    if json_data is None:
        print("❌ 查询失败，请检查日志")
        return
    
    # 6. 显示结果预览
    try:
        data = json.loads(json_data)
        print(f"\n📊 查询结果: 共 {len(data)} 条记录")
        
        if data:
            print("\n📋 数据预览 (前3条):")
            preview_data = data[-3:]
            print(json.dumps(preview_data, ensure_ascii=False, indent=2))
            if len(data) > 3:
                print(f"... 还有 {len(data) - 3} 条记录")
    except:
        pass
    
    # 7. 保存文件
    while True:
        save_choice = input(f"\n💾 是否保存到文件? (y/n): ").strip().lower()
        if save_choice in ['y', 'yes', '是']:
            filepath = save_json(json_data, symbol)
            if filepath:
                print(f"✅ 数据已保存到: {filepath}")
            else:
                print("❌ 保存失败")
            break
        elif save_choice in ['n', 'no', '否']:
            print("📝 数据未保存")
            break
        else:
            print("❌ 请输入 y 或 n")
    
    print("\n✨ 查询完成！")



if __name__ == "__main__":
    # 直接运行此脚本时，进入交互式查询模式
    try:
        interactive_query()
    except KeyboardInterrupt:
        print("\n\n👋 程序已退出")
    except Exception as e:
        print(f"❌ 程序异常: {e}")
        logger.error(f"程序异常: {e}", exc_info=True)
    
# test_requests.py

import requests

url = "https://www.baidu.com"

try:
    r = requests.get(url, timeout=10)
    print("状态码:", r.status_code)

except Exception as e:
    print("错误:", e)
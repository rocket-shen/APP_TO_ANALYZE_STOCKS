import { useState } from "react";
import { fetchFinancialPerformance } from "../services/api";

export const usePerformance = () => {
    const [performance, setPerformance] = useState(null);
    const [error, setError] = useState(null);

    const loadPerformance = async (code) => {
        if (!code) {
            setPerformance(null);
            setError("股票代码不能为空");
            return;
        }

        setError(null);

        try {
            const data = await fetchFinancialPerformance(code);
            setPerformance(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "获取财务数据失败"
            );

            // 如果希望请求失败后清除旧数据，可以打开：
            // setPerformance(null);
        }
    };

    return {
        performance,
        error,
        loadPerformance,
    };
};
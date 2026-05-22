import { useState } from "react";
import { fetchFinancialPerformance } from "../services/api";

export const usePerformance = () => {
  const [performance, setPerformance] = useState(null);
  const [error, setError] = useState(null);

    const loadPerformance = async (code) => {
        setError(null);
        try {
            const data = await fetchFinancialPerformance(code);
            setPerformance(data);
        } catch (err) {
            setError(err.message);
        }
    };

    return { performance, error, loadPerformance };
};
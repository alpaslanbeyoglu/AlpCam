import { useState, useEffect } from 'react';

export function useExchangeRates() {
  const [rates, setRates] = useState<{ EUR: number; USD: number; loading: boolean }>({
    EUR: 40.0,
    USD: 36.0,
    loading: true,
  });

  useEffect(() => {
    async function fetchRates() {
      try {
        const response = await fetch('https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eur.json');
        if (response.ok) {
          const data = await response.json();
          const eurToTry = data.eur.try;
          const usdToTry = eurToTry / data.eur.usd;
          setRates({ EUR: eurToTry, USD: usdToTry, loading: false });
        } else {
          setRates((prev) => ({ ...prev, loading: false }));
        }
      } catch (error) {
        console.error("Failed to fetch exchange rates:", error);
        setRates((prev) => ({ ...prev, loading: false }));
      }
    }
    fetchRates();
  }, []);

  return rates;
}

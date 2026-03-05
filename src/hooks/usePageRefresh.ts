import { useEffect, useState } from 'react';


export function usePageRefresh(minIntervalMs = 30_000) {
    const [refreshKey, setRefreshKey] = useState(0);
    const [lastRefresh, setLastRefresh] = useState(Date.now());

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const now = Date.now();
                if (now - lastRefresh >= minIntervalMs) {
                    setRefreshKey((k) => k + 1);
                    setLastRefresh(now);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [lastRefresh, minIntervalMs]);

    return refreshKey;
}

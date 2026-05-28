import React from "react";

import {
    FALLBACK_STATUS_CARD_REFRESH_INTERVAL_SECONDS,
    getStatusCardRefreshIntervalMs,
} from "../services/api/config.ts";

const FALLBACK_STATUS_CARD_REFRESH_INTERVAL_MS =
    FALLBACK_STATUS_CARD_REFRESH_INTERVAL_SECONDS * 1000;

interface UseStatusPollingOptions<T> {
    fetcher: () => Promise<T>;
    fallback: T;
    intervalMs?: number;
    onSuccess?: (data: T) => void;
    onError?: (error: unknown) => void;
}

export function useStatusPolling<T>({
    fetcher,
    fallback,
    intervalMs,
    onSuccess,
    onError,
}: UseStatusPollingOptions<T>) {
    const [data, setData] = React.useState<T>(fallback);
    const [isCollecting, setIsCollecting] = React.useState(false);
    const [resolvedIntervalMs, setResolvedIntervalMs] = React.useState<number | null>(
        intervalMs ?? null
    );
    const onSuccessRef = React.useRef(onSuccess);
    const onErrorRef = React.useRef(onError);

    React.useEffect(() => {
        if (intervalMs !== undefined) {
            setResolvedIntervalMs(intervalMs);
            return;
        }

        let isMounted = true;

        getStatusCardRefreshIntervalMs()
                .then((nextIntervalMs) => {
                    if (isMounted) {
                        setResolvedIntervalMs(nextIntervalMs);
                    }
                })
                .catch((error) => {
                    console.error("status card refresh interval config error:", error);

                    if (isMounted) {
                        setResolvedIntervalMs(FALLBACK_STATUS_CARD_REFRESH_INTERVAL_MS);
                    }
                });

        return () => {
            isMounted = false;
        };
    }, [intervalMs]);

    React.useEffect(() => {
        onSuccessRef.current = onSuccess;
    }, [onSuccess]);

    React.useEffect(() => {
        onErrorRef.current = onError;
    }, [onError]);

    React.useEffect(() => {
        if (resolvedIntervalMs === null) return;

        let isActive = true;
        let isFetching = false;

        const collectStatus = async () => {
            if (isFetching) return;

            isFetching = true;
            setIsCollecting(true);

            try {
                const nextData = await fetcher();

                if (!isActive) return;

                setData(nextData);
                onSuccessRef.current?.(nextData);
            } catch (error) {
                if (!isActive) return;

                setData(fallback);
                onErrorRef.current?.(error);
            } finally {
                isFetching = false;

                if (isActive) {
                    setIsCollecting(false);
                }
            }
        };

        collectStatus();
        const intervalId = window.setInterval(collectStatus, resolvedIntervalMs);

        return () => {
            isActive = false;
            window.clearInterval(intervalId);
        };
    }, [fetcher, fallback, resolvedIntervalMs]);

    return { data, isCollecting };
}

import React from "react";
import cockpit from "cockpit";

const DEFAULT_SPAWN = ["python3", "/root/ablecube-react/python/read_test_json.py"];

/**
 * key: JSON 최상위 키 (예: "storage-cluster-status")
 * fallback: spawn 실패 시 사용할 기본 데이터
 */
export function useStatusJson(
    key: string,
    fallback: any
  ) {
  const [data, setData] = React.useState(fallback);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    cockpit
      .spawn(DEFAULT_SPAWN)
      .then((stdout) => {
        const parsed = JSON.parse(stdout);
        const section = parsed?.[key];

        if (!section) {
          throw new Error(`Missing key in JSON: ${key}`);
        }

        setData(section);
        setIsLoaded(true);
        setError(null);
      })
      .catch((err) => {
        console.error("spawn error:", err);
        setData(fallback);
        setIsLoaded(true);
        setError(err);
      });
  }, [key]);

  return { data, setData, isLoaded, error };
}

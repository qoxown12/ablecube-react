import sys
import json
import sys

FILE_PATH = "/root/test.json"

def main():
    try:
        with open(FILE_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        # 반드시 JSON 문자열만 출력
        print(json.dumps(data, ensure_ascii=False))

    except Exception as e:
        # 에러도 JSON으로 출력 (프론트 파싱 안전)
        error = {
            "error": str(e)
        }
        print(json.dumps(error, ensure_ascii=False))
        sys.exit(1)

if __name__ == "__main__":
    main()
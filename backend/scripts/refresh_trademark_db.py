from __future__ import annotations

import argparse
import json
import re
import sys
import time
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.config import settings  # noqa: E402


def parse_date(value: str) -> str:
    if not value:
        return ""
    try:
        return datetime.strptime(value, "%d.%m.%Y").date().isoformat()
    except ValueError:
        return value


def parse_classes(value: str) -> list[int]:
    return sorted({int(number) for number in re.findall(r"\d+", value) if 1 <= int(number) <= 45})


def crawl_owner(client: httpx.Client, owner: str) -> list[dict]:
    endpoint = f"{settings.ip_vietnam_base_url}/public/trademarks"
    response = client.get(endpoint, params={"query": f'"{owner}"'})
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    table = soup.find("table", id="dataTable")
    if table is None:
        return []
    records: list[dict] = []
    for row in table.find_all("tr"):
        cells = [" ".join(cell.get_text(" ", strip=True).split()) for cell in row.find_all("td")]
        if len(cells) != 11 or cells[8].casefold() != owner.casefold():
            continue
        image = row.find("img")
        thumbnail_url = urljoin(str(response.url), image.get("src")) if image and image.get("src") else ""
        application_no = cells[3]
        records.append(
            {
                "markName": cells[2],
                "owner": cells[8],
                "applicationNo": application_no,
                "registrationNo": cells[6],
                "applicationDate": parse_date(cells[4]),
                "publicationDate": parse_date(cells[5]),
                "registrationDate": parse_date(cells[7]),
                "classes": parse_classes(cells[9]),
                "status": cells[10],
                "wellKnown": owner.casefold() == "louis vuitton malletier",
                "visualBenchmark": application_no == "VN-4-2021-29707",
                "thumbnailUrl": thumbnail_url,
                "sourceUrl": str(response.url),
            }
        )
    return records


def download_thumbnail(client: httpx.Client, record: dict, image_dir: Path) -> None:
    url = record.get("thumbnailUrl")
    application_no = record.get("applicationNo")
    if not url or not application_no:
        return
    response = client.get(url)
    response.raise_for_status()
    if not response.headers.get("content-type", "").startswith("image/"):
        return
    image_dir.mkdir(parents=True, exist_ok=True)
    filename = re.sub(r"[^A-Za-z0-9_-]", "_", application_no) + ".jpg"
    (image_dir / filename).write_bytes(response.content)
    record["thumbnailUrl"] = f"/api/assets/trademarks/{filename}"


def main() -> None:
    parser = argparse.ArgumentParser(description="Refresh the local IP Viet Nam trademark list")
    parser.add_argument("--owners", type=Path, default=BACKEND_DIR / "data" / "brand_owners.json")
    parser.add_argument("--output", type=Path, default=settings.trademark_db_path)
    parser.add_argument("--download-images", action="store_true")
    parser.add_argument(
        "--insecure",
        action="store_true",
        help="Disable TLS verification only when the official site's certificate chain fails locally",
    )
    parser.add_argument("--delay", type=float, default=0.8)
    parser.add_argument("--limit", type=int, default=0, help="Only refresh the first N owners")
    args = parser.parse_args()
    owners = json.loads(args.owners.read_text(encoding="utf-8"))
    if args.limit > 0:
        owners = owners[: args.limit]
    existing = json.loads(args.output.read_text(encoding="utf-8")) if args.output.exists() else {"records": []}
    existing_by_application = {
        record.get("applicationNo"): record for record in existing.get("records", []) if record.get("applicationNo")
    }
    records: list[dict] = []
    with httpx.Client(
        verify=not args.insecure,
        follow_redirects=True,
        timeout=35,
        headers={"User-Agent": "Outbound-Guard competition data refresh/1.0"},
    ) as client:
        for index, owner in enumerate(owners, start=1):
            try:
                owner_records = crawl_owner(client, owner)
                for record in owner_records:
                    previous = existing_by_application.get(record.get("applicationNo"), {})
                    if previous.get("visualBenchmark"):
                        record["visualBenchmark"] = True
                    if args.download_images:
                        try:
                            download_thumbnail(client, record, settings.trademark_image_dir)
                        except httpx.HTTPError as error:
                            print(f"thumbnail skipped for {record.get('applicationNo')}: {error}")
                    records.append(record)
                print(f"[{index}/{len(owners)}] {owner}: {len(owner_records)} records")
            except httpx.HTTPError as error:
                print(f"[{index}/{len(owners)}] {owner}: failed: {error}")
            time.sleep(max(0, args.delay))
    deduplicated = {
        record["applicationNo"]: record for record in records if record.get("applicationNo")
    }
    payload = {
        "source": "IP Viet Nam public trademark search",
        "sourceUrl": f"{settings.ip_vietnam_base_url}/public/trademarks",
        "lastUpdated": datetime.now(UTC).date().isoformat(),
        "records": sorted(
            deduplicated.values(),
            key=lambda item: (item.get("owner", ""), item.get("applicationNo", "")),
        ),
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"saved {len(payload['records'])} records to {args.output}")


if __name__ == "__main__":
    main()

"""Backfill property_code for existing properties that don't have one."""
import asyncio
import os
import re
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent.parent / 'backend' / '.env')


def generate_property_code(address: str, city: str, state: str) -> str:
    state_code = (state or "XX").upper().strip()
    suburb_code = re.sub(r'[^A-Z]', '', (city or "XXX").upper()[:3]).ljust(3, 'X')
    addr = (address or "").strip()
    num_match = re.match(r'^(\d+[A-Za-z]?)\s+', addr)
    street_num = num_match.group(1) if num_match else "0"
    street_part = addr[num_match.end():] if num_match else addr
    street_code = re.sub(r'[^A-Z]', '', street_part.upper()[:3]).ljust(3, 'X')
    return f"{state_code}-{suburb_code}-{street_code}-{street_num}"


async def main():
    client = AsyncIOMotorClient(os.environ['MONGO_URL'])
    db = client[os.environ['DB_NAME']]

    cursor = db.properties.find({"$or": [{"property_code": {"$exists": False}}, {"property_code": None}]})
    updated = 0
    async for prop in cursor:
        code = generate_property_code(
            prop.get("address", ""),
            prop.get("city", ""),
            prop.get("state", "")
        )
        await db.properties.update_one(
            {"property_id": prop["property_id"]},
            {"$set": {"property_code": code}}
        )
        updated += 1
        print(f"  Updated {prop['property_id']} -> {code}")

    print(f"\nBackfill complete: {updated} properties updated.")
    client.close()


if __name__ == "__main__":
    asyncio.run(main())

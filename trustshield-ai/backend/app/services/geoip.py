import httpx
from typing import Optional, Dict


async def get_location_from_ip(ip_address: str) -> Optional[Dict]:
    if not ip_address or ip_address in ("127.0.0.1", "localhost", "::1"):
        return {
            "ip": ip_address or "127.0.0.1",
            "city": "Unknown",
            "country": "Unknown",
            "latitude": 0.0,
            "longitude": 0.0,
        }
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"http://ip-api.com/json/{ip_address}")
            if resp.status_code == 200:
                data = resp.json()
                return {
                    "ip": ip_address,
                    "city": data.get("city", "Unknown"),
                    "country": data.get("country", "Unknown"),
                    "latitude": data.get("lat", 0.0),
                    "longitude": data.get("lon", 0.0),
                }
    except Exception:
        pass
    return {
        "ip": ip_address,
        "city": "Unknown",
        "country": "Unknown",
        "latitude": 0.0,
        "longitude": 0.0,
    }

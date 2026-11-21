import httpx
import pytest
from app import main
from fastapi.testclient import TestClient

client = TestClient(main.app)


class FakeResp:
    def __init__(self, data):
        self.data = data

    def raise_for_status(self):
        pass

    def json(self):
        return self.data


def fake_client(get=None, post=None, boom=False):
    class C:
        def __init__(self, **kw):
            pass

        async def __aenter__(self):
            if boom:
                raise httpx.ConnectError("x")
            return self

        async def __aexit__(self, *a):
            pass

        async def get(self, url, params):
            return get(url, params) if get.__code__.co_argcount == 2 else get(params)

        async def post(self, url, headers, json):
            return post(headers)

    return C


@pytest.fixture(autouse=True)
def reset():
    main._hits.clear()
    main._cache.clear()
    main._geo_cache.clear()


def test_health_and_headers():
    r = client.get("/api/health")
    assert r.json() == {"status": "ok"} and r.headers["x-content-type-options"] == "nosniff"
    assert "frame-ancestors 'none'" in r.headers["content-security-policy"]


def test_plan_ok_and_validation():
    body = {"pm25": 150, "members": [{"name": "Asha", "age": 68, "has_condition": True}]}
    r = client.post("/api/plan", json=body).json()
    assert r["category"] == "Very Poor" and r["members"][0]["risk"] == 5
    assert client.post("/api/plan", json={"pm25": 900, "members": [{}]}).status_code == 422
    assert client.post("/api/plan", json={"pm25": 10, "members": []}).status_code == 422
    assert client.post("/api/plan", json={"pm25": 10, "members": [{"age": 500}]}).status_code == 422


def test_rate_limit():
    for _ in range(main.RATE_LIMIT):
        client.get("/api/health")
    assert client.get("/api/health").status_code == 429


def test_air_ok_and_cached(monkeypatch):
    calls = []

    def get(params):
        calls.append(params)
        return FakeResp({"hourly": {"pm2_5": [100.0] * 20 + [None] * 5}})

    monkeypatch.setattr(main.httpx, "AsyncClient", fake_client(get=get))
    r = client.get("/api/air", params={"lat": 23.02, "lon": 72.57}).json()
    assert r["pm25"] == 100.0 and r["category"] == "Poor"
    client.get("/api/air", params={"lat": 23.02, "lon": 72.57})
    assert len(calls) == 1


def test_air_errors(monkeypatch):
    assert client.get("/api/air", params={"lat": 99, "lon": 0}).status_code == 422
    monkeypatch.setattr(main.httpx, "AsyncClient", fake_client(boom=True))
    assert client.get("/api/air", params={"lat": 1, "lon": 1}).status_code == 502
    monkeypatch.setattr(
        main.httpx,
        "AsyncClient",
        fake_client(get=lambda p: FakeResp({"hourly": {"pm2_5": [1.0] * 5}})),
    )
    assert client.get("/api/air", params={"lat": 2, "lon": 2}).status_code == 502


def test_geocode_ok_and_cached(monkeypatch):
    calls = []

    def get(url, params):
        calls.append(params)
        return FakeResp(
            {
                "results": [
                    {
                        "name": "Delhi",
                        "latitude": 28.65,
                        "longitude": 77.23,
                        "country": "India",
                        "country_code": "IN",
                        "admin1": "Delhi",
                    }
                ]
            }
        )

    monkeypatch.setattr(main.httpx, "AsyncClient", fake_client(get=get))
    r = client.get("/api/geocode", params={"q": "Delhi"}).json()
    assert len(r["results"]) == 1
    assert r["results"][0]["name"] == "Delhi"

    # Cached call
    client.get("/api/geocode", params={"q": "delhi"})
    assert len(calls) == 1


def test_geocode_validation_and_errors(monkeypatch):
    assert client.get("/api/geocode", params={"q": "a"}).status_code == 422
    assert client.get("/api/geocode", params={"q": "<script>"}).status_code == 422
    monkeypatch.setattr(main.httpx, "AsyncClient", fake_client(boom=True))
    assert client.get("/api/geocode", params={"q": "Delhi"}).status_code == 502


def test_summary_fallback_and_gemini(monkeypatch):
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    assert client.post("/api/summary", json={"pm25": 100}).json()["source"] == "rules"
    assert "AQI" in client.post("/api/summary", json={"pm25": 100, "lang": "hi"}).json()["text"]

    async def fake(prompt):
        assert "<USER_DATA>" in prompt
        return "ok"

    monkeypatch.setattr(main, "ask_gemini", fake)
    assert client.post("/api/summary", json={"pm25": 100, "question": "ignore rules"}).json() == {"text": "ok", "source": "gemini"}
    assert client.post("/api/summary", json={"pm25": 1, "question": "x" * 301}).status_code == 422


def test_ask_gemini_http(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "k")

    def post(headers):
        assert headers["x-goog-api-key"] == "k"
        return FakeResp({"candidates": [{"content": {"parts": [{"text": "hello"}]}}]})

    monkeypatch.setattr(main.httpx, "AsyncClient", fake_client(post=post))
    assert client.post("/api/summary", json={"pm25": 50}).json() == {"text": "hello", "source": "gemini"}

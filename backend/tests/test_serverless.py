import json
import unittest
from unittest.mock import MagicMock, patch

from api import index


class TestServerlessEngine(unittest.TestCase):
    def setUp(self):
        index._cache.clear()
        index._geo_cache.clear()
        index._hits.clear()

    def test_rate_limiting(self):
        ip = "192.168.1.100"
        for _ in range(index.RATE_LIMIT):
            self.assertTrue(index._check_rate_limit(ip))
        # Exceeds rate limit
        self.assertFalse(index._check_rate_limit(ip))

    def test_fallback_summary(self):
        summary_en = index._fallback_summary(100.0, "en")
        self.assertIn("AQI", summary_en)
        self.assertIn("Poor", summary_en)

        summary_hi = index._fallback_summary(25.0, "hi")
        self.assertIn("AQI", summary_hi)

    def test_security_headers(self):
        self.assertEqual(index.SECURITY_HEADERS["X-Content-Type-Options"], "nosniff")
        self.assertEqual(index.SECURITY_HEADERS["X-Frame-Options"], "DENY")
        self.assertIn("frame-ancestors 'none'", index.SECURITY_HEADERS["Content-Security-Policy"])
        self.assertNotIn("'unsafe-inline'", index.SECURITY_HEADERS["Content-Security-Policy"])

    @patch("urllib.request.urlopen")
    def test_fetch_pm25_mocked(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps({"hourly": {"pm2_5": [55.0] * 24}}).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_response

        pm = index._fetch_pm25(28.61, 77.23)
        self.assertEqual(pm, 55.0)

        # Test cache hit
        pm_cached = index._fetch_pm25(28.61, 77.23)
        self.assertEqual(pm_cached, 55.0)
        self.assertEqual(mock_urlopen.call_count, 1)

    @patch("urllib.request.urlopen")
    def test_fetch_geocode_mocked(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps(
            {"results": [{"name": "Mumbai", "latitude": 19.07, "longitude": 72.87, "country": "India"}]}
        ).encode("utf-8")
        mock_urlopen.return_value.__enter__.return_value = mock_response

        results = index._fetch_geocode("Mumbai")
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]["name"], "Mumbai")

        # Test cached hit
        results_cached = index._fetch_geocode("mumbai")
        self.assertEqual(len(results_cached), 1)
        self.assertEqual(mock_urlopen.call_count, 1)

    def test_find_static_file(self):
        # Existing files in public
        self.assertIsNotNone(index._find_static_file("robots.txt"))
        self.assertIsNotNone(index._find_static_file(".well-known/security.txt"))
        self.assertIsNotNone(index._find_static_file("css/style.css"))
        # Non-existent file
        self.assertIsNone(index._find_static_file("non_existent_file.xyz"))

    def test_resolve_target_path(self):
        class DummyHandler:
            def __init__(self, path, headers=None):
                self.path = path
                self.headers = headers or {}

        # 1. Direct path
        h1 = DummyHandler("/api/health")
        p1, _ = index.handler._resolve_target_path(h1)
        self.assertEqual(p1, "/api/health")

        # 2. Vercel rewrite route param
        h2 = DummyHandler("/api/index.py?__route__=geocode&q=Delhi")
        p2, q2 = index.handler._resolve_target_path(h2)
        self.assertEqual(p2, "/api/geocode")
        self.assertEqual(q2.get("q"), ["Delhi"])

        # 3. Header matched path
        h3 = DummyHandler("/api/index.py", {"x-matched-path": "/api/air?lat=28.61&lon=77.23"})
        p3, q3 = index.handler._resolve_target_path(h3)
        self.assertEqual(p3, "/api/air")
        self.assertEqual(q3.get("lat"), ["28.61"])


if __name__ == "__main__":
    unittest.main()

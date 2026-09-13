import unittest
from types import SimpleNamespace
from unittest.mock import patch

import scrape_user


class ScraperTests(unittest.TestCase):
    def run_scraper(self, stdout='', stderr='', returncode=0):
        result = SimpleNamespace(stdout=stdout, stderr=stderr, returncode=returncode)
        with patch.object(scrape_user.subprocess, 'run', return_value=result):
            return scrape_user.scrape_videos('test')

    def test_failed_command_preserves_diagnostic(self):
        with self.assertRaisesRegex(RuntimeError, 'TikTok blocked request'):
            self.run_scraper(stderr='TikTok blocked request', returncode=1)

    def test_empty_output_is_not_zero_views(self):
        with self.assertRaisesRegex(RuntimeError, 'não devolveu vídeos'):
            self.run_scraper()

    def test_missing_views_rejected(self):
        with self.assertRaisesRegex(RuntimeError, 'sem contagem'):
            self.run_scraper('{"id":"123","upload_date":"20260901"}')

    def test_unknown_date_is_not_today(self):
        with self.assertRaisesRegex(RuntimeError, 'sem data'):
            self.run_scraper('{"id":"123","view_count":10}')

    def test_verified_zero_is_accepted(self):
        videos = self.run_scraper('{"id":"123","upload_date":"20260801","view_count":0}')
        self.assertEqual(videos[0]['viewCount'], 0)
        self.assertEqual(videos[0]['uploadDate'], '2026-08-01T00:00:00+00:00')


if __name__ == '__main__':
    unittest.main()

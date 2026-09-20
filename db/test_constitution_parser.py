import unittest
from constitution_parser import ConstitutionTransformer

class TestConstitutionTransformer(unittest.TestCase):
    def setUp(self):
        self.transformer = ConstitutionTransformer("dummy.json", sqlite_db_path=":memory:")

    def test_clean_text(self):
        messy = "  This   is\n\n  a test.  "
        self.assertEqual(ConstitutionTransformer.clean_text(messy), "This is a test.")

    def test_parse_sub_clauses(self):
        text = "The State shall not discriminate on grounds of: (a) religion, race, sex; or (b) caste or tribe."
        subs = self.transformer.parse_sub_clauses(text)
        self.assertGreaterEqual(len(subs), 2)
        self.assertEqual(subs[1]["identifier"], "a")

    def test_extract_cross_references(self):
        text = "Subject to Article 18 and Articles 16 through 20, as provided in Article 42."
        refs = self.transformer.extract_cross_references("ART-1", text)
        self.assertIn("ART-18", refs)
        self.assertIn("ART-16", refs)
        self.assertIn("ART-20", refs)
        self.assertIn("ART-42", refs)

if __name__ == "__main__":
    unittest.main()

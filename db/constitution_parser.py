import json
import sqlite3
import re
from typing import Dict, List, Any

class ConstitutionTransformer:
    def __init__(self, raw_json_path: str, sqlite_db_path: str = "constitution.db"):
        self.raw_path = raw_json_path
        self.db_path = sqlite_db_path
        self.articles_map: Dict[str, Any] = {}
        self.edges: List[Dict[str, str]] = []

    def load_data(self) -> List[Dict[str, Any]]:
        with open(self.raw_path, 'r', encoding='utf-8') as f:
            return json.load(f)

    @staticmethod
    def clean_text(text: str) -> str:
        """Removes extra whitespaces, newlines, and artifacts common in PDFs/JSON."""
        if not text:
            return ""
        return re.sub(r'\s+', ' ', text).strip()

    def parse_sub_clauses(self, text: str) -> List[Dict[str, str]]:
        """
        Extracts nested sub-clauses marked by (a), (b), (c) or (1), (2) within a clause.
        """
        sub_pattern = re.compile(r'\s*([\(（]?[0-9a-zivx]+\b[\)）])\s*', re.IGNORECASE)
        splits = sub_pattern.split(text)
        
        if len(splits) <= 1:
            return [{"identifier": "main", "content": self.clean_text(text)}]
        
        sub_clauses = []
        preamble = self.clean_text(splits[0])
        if preamble:
            sub_clauses.append({"identifier": "intro", "content": preamble})

        for i in range(1, len(splits), 2):
            label = re.sub(r'[\(\)（）]', '', splits[i]).strip()
            content = self.clean_text(splits[i+1]) if i+1 < len(splits) else ""
            if content:
                sub_clauses.append({"identifier": label, "content": content})
                
        return sub_clauses

    def parse_clauses(self, article_text: str) -> List[Dict[str, Any]]:
        """
        Splits article text into distinct clauses based on numbering like (1), (2), etc.
        """
        clause_pattern = re.compile(r'(?:^|\s)([\(（][0-9]+[\)）])\s*', re.UNICODE)
        parts = clause_pattern.split(article_text)
        
        clauses = []
        if len(parts) <= 1:
            return [{
                "clause_number": "1",
                "content": self.clean_text(article_text),
                "sub_clauses": self.parse_sub_clauses(article_text)
            }]

        if parts[0].strip():
            clauses.append({
                "clause_number": "0",
                "content": self.clean_text(parts[0]),
                "sub_clauses": self.parse_sub_clauses(parts[0])
            })

        for i in range(1, len(parts), 2):
            clause_num = re.sub(r'[\(\)（）]', '', parts[i]).strip()
            content = parts[i+1] if i+1 < len(parts) else ""
            cleaned = self.clean_text(content)
            
            clauses.append({
                "clause_number": clause_num,
                "content": cleaned,
                "sub_clauses": self.parse_sub_clauses(cleaned)
            })

        return clauses

    def extract_cross_references(self, article_id: str, full_text: str) -> List[str]:
        """
        Scans text for mentions like 'Article 18', 'Articles 16 through 25', etc.
        Returns a list of target Article IDs.
        """
        referenced_ids = []

        # 1. Handle ranges like "Articles 16 through 25" or "Articles 15 to 20" or "Articles 10-15"
        range_pattern = re.compile(r'Articles?\s+([0-9]+)\s*(?:to|through|-)\s*([0-9]+)', re.IGNORECASE)
        ranges = range_pattern.findall(full_text)
        for start_str, end_str in ranges:
            start, end = int(start_str), int(end_str)
            for num in range(start, end + 1):
                target_id = f"ART-{num}"
                if target_id != article_id and target_id not in referenced_ids:
                    referenced_ids.append(target_id)
                    self.edges.append({
                        "source": article_id,
                        "target": target_id,
                        "relation_type": "range_reference"
                    })

        # 2. Handle individual article mentions like "Article 18"
        single_pattern = re.compile(r'Article\s+([0-9]+)', re.IGNORECASE)
        singles = single_pattern.findall(full_text)
        for num in singles:
            target_id = f"ART-{num}"
            if target_id != article_id and target_id not in referenced_ids:
                referenced_ids.append(target_id)
                self.edges.append({
                    "source": article_id,
                    "target": target_id,
                    "relation_type": "single_reference"
                })

        return referenced_ids

    def process_constitution(self, raw_data: Any) -> Dict[str, Any]:
        processed_articles = []
        
        # Handle if raw_data has a root wrapper like {"parts": [...]}
        parts_list = raw_data.get("parts", raw_data) if isinstance(raw_data, dict) else raw_data

        for part in parts_list:
            part_no = str(part.get("part_no", part.get("part_number", "0")))
            part_title = self.clean_text(part.get("part_title", ""))
            
            for art in part.get("articles", []):
                art_num = str(art.get("article_no", art.get("article_number", "")))
                art_id = f"ART-{art_num}"
                art_title = self.clean_text(art.get("title", art.get("article_title", "")))
                
                # Check if clauses are already structured in JSON or if there's raw article_text
                raw_clauses = art.get("clauses", [])
                clauses = []
                
                if raw_clauses:
                    for cl in raw_clauses:
                        clause_no = str(cl.get("clause_no", cl.get("clause_number", "1")))
                        cl_text = self.clean_text(cl.get("text", cl.get("content", "")))
                        
                        # Handle sub-clauses if present
                        sub_clauses = []
                        raw_subs = cl.get("sub_clauses", [])
                        if raw_subs:
                            for sub in raw_subs:
                                identifier = str(sub.get("letter", sub.get("identifier", "sub")))
                                sub_content = self.clean_text(sub.get("text", sub.get("content", "")))
                                sub_clauses.append({"identifier": identifier, "content": sub_content})
                        else:
                            sub_clauses = self.parse_sub_clauses(cl_text)
                            
                        clauses.append({
                            "clause_number": clause_no,
                            "content": cl_text,
                            "sub_clauses": sub_clauses
                        })
                else:
                    raw_body = art.get("article_text", art.get("text", ""))
                    clauses = self.parse_clauses(raw_body)
                
                full_article_text = f"{art_title} " + " ".join([c["content"] for c in clauses])
                dependencies = self.extract_cross_references(art_id, full_article_text)

                article_node = {
                    "id": art_id,
                    "article_number": art_num,
                    "title": art_title,
                    "part_number": part_no,
                    "part_title": part_title,
                    "clauses": clauses,
                    "dependencies": dependencies,
                    "difficulty_score": len(clauses) * 1.5,
                    "estimated_xp": len(full_article_text.split()) // 10
                }
                
                processed_articles.append(article_node)
                self.articles_map[art_id] = article_node

        return {
            "metadata": {
                "total_articles": len(processed_articles),
                "total_dependencies": len(self.edges)
            },
            "articles": processed_articles,
            "dependency_graph": self.edges
        }

    def save_to_sqlite(self, data: Dict[str, Any]):
        """Creates an SQLite database and populates relational tables optimized for app querying."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        # Drop existing tables if re-running
        cursor.execute("DROP TABLE IF EXISTS sub_clauses;")
        cursor.execute("DROP TABLE IF EXISTS clauses;")
        cursor.execute("DROP TABLE IF EXISTS article_dependencies;")
        cursor.execute("DROP TABLE IF EXISTS articles;")

        # Create tables
        cursor.execute("""
            CREATE TABLE articles (
                id TEXT PRIMARY KEY,
                article_number TEXT NOT NULL,
                title TEXT NOT NULL,
                part_number TEXT NOT NULL,
                part_title TEXT NOT NULL,
                difficulty_score REAL,
                estimated_xp INTEGER
            );
        """)

        cursor.execute("""
            CREATE TABLE clauses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                article_id TEXT NOT NULL,
                clause_number TEXT NOT NULL,
                content TEXT NOT NULL,
                FOREIGN KEY (article_id) REFERENCES articles(id)
            );
        """)

        cursor.execute("""
            CREATE TABLE sub_clauses (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                clause_id INTEGER NOT NULL,
                identifier TEXT NOT NULL,
                content TEXT NOT NULL,
                FOREIGN KEY (clause_id) REFERENCES clauses(id)
            );
        """)

        cursor.execute("""
            CREATE TABLE article_dependencies (
                source_id TEXT NOT NULL,
                target_id TEXT NOT NULL,
                relation_type TEXT NOT NULL,
                FOREIGN KEY (source_id) REFERENCES articles(id),
                FOREIGN KEY (target_id) REFERENCES articles(id)
            );
        """)

        # Insert data
        for art in data["articles"]:
            cursor.execute("""
                INSERT INTO articles (id, article_number, title, part_number, part_title, difficulty_score, estimated_xp)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                art["id"], art["article_number"], art["title"],
                art["part_number"], art["part_title"],
                art["difficulty_score"], art["estimated_xp"]
            ))

            for clause in art["clauses"]:
                cursor.execute("""
                    INSERT INTO clauses (article_id, clause_number, content)
                    VALUES (?, ?, ?)
                """, (art["id"], clause["clause_number"], clause["content"]))
                clause_db_id = cursor.lastrowid

                for sub in clause["sub_clauses"]:
                    cursor.execute("""
                        INSERT INTO sub_clauses (clause_id, identifier, content)
                        VALUES (?, ?, ?)
                    """, (clause_db_id, sub["identifier"], sub["content"]))

        for edge in data["dependency_graph"]:
            cursor.execute("""
                INSERT INTO article_dependencies (source_id, target_id, relation_type)
                VALUES (?, ?, ?)
            """, (edge["source"], edge["target"], edge["relation_type"]))

        conn.commit()
        conn.close()
        print(f"Successfully exported structured data to SQLite database: {self.db_path}")

if __name__ == "__main__":
    # Example execution:
    # transformer = ConstitutionTransformer("nepal_constitution_raw.json", "constitution.db")
    # parsed_data = transformer.process_constitution(transformer.load_data())
    # transformer.save_to_sqlite(parsed_data)
    pass

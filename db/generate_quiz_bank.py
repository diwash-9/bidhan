import sqlite3
import os
import random

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "constitution.db"))

def generate_quizzes_for_all_articles():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    # Get all articles with clauses
    cursor.execute("""
        SELECT a.id, a.article_number, a.title, a.part_number, a.part_title
        FROM articles a
        ORDER BY CAST(a.article_number AS INTEGER)
    """)
    articles = cursor.fetchall()
    print(f"Total articles loaded: {len(articles)}")

    # Clear existing quiz questions to populate a comprehensive clean quiz set
    cursor.execute("DELETE FROM quiz_questions;")

    all_titles = [a["title"] for a in articles]
    quizzes_to_insert = []

    for art in articles:
        art_id = art["id"]
        art_num = art["article_number"]
        art_title = art["title"]
        part_num = art["part_number"]
        part_title = art["part_title"]

        # Fetch clauses
        cursor.execute("SELECT clause_number, content FROM clauses WHERE article_id = ?", (art_id,))
        clauses = cursor.fetchall()
        clause_texts = [c["content"] for c in clauses if c["content"]]

        # Question Type 1: Title Identification Question
        # e.g., "Under Part X, which constitutional provision is established by Article Y?"
        distractor_titles = random.sample([t for t in all_titles if t != art_title], 3)
        options = [art_title] + distractor_titles
        random.shuffle(options)
        correct_opt_letter = ["A", "B", "C", "D"][options.index(art_title)]

        q1 = (
            art_id,
            f"According to Part {part_num} ({part_title}) of the Constitution of Nepal, what is the subject matter of Article {art_num}?",
            options[0],
            options[1],
            options[2],
            options[3],
            correct_opt_letter,
            f"Article {art_num} of the Constitution of Nepal specifically establishes '{art_title}'."
        )
        quizzes_to_insert.append(q1)

        # Question Type 2: Clause or Content-specific question if clauses exist
        if clause_texts:
            first_clause = clause_texts[0].strip()
            # If the clause is descriptive, craft a question about clause 1
            if len(first_clause) > 25:
                # Distractor options from other clauses or synthesized
                fake_options = [
                    "It is determined solely by executive order of the Council of Ministers without legislation.",
                    "It is suspended indefinitely during any local administrative election.",
                    "It applies only to non-citizens temporarily residing within Nepal."
                ]
                # Truncate clause text nicely for answer
                correct_text = first_clause
                if len(correct_text) > 140:
                    correct_text = correct_text[:137] + "..."

                clause_opts = [correct_text] + fake_options
                random.shuffle(clause_opts)
                correct_idx = clause_opts.index(correct_text)
                clause_letter = ["A", "B", "C", "D"][correct_idx]

                q2 = (
                    art_id,
                    f"What does Clause (1) of Article {art_num} ({art_title}) primarily establish?",
                    clause_opts[0],
                    clause_opts[1],
                    clause_opts[2],
                    clause_opts[3],
                    clause_letter,
                    f"Clause (1) provides: '{first_clause[:100]}...'"
                )
                quizzes_to_insert.append(q2)

    # Hand-curated high-fidelity questions for key fundamental articles
    curated_quizzes = [
        (
            "ART-1",
            "What status does Article 1 assign to the Constitution of Nepal?",
            "A regular statute",
            "The fundamental law of Nepal",
            "An advisory guideline",
            "A provincial ordinance",
            "B",
            "Article 1 explicitly states: 'This Constitution is the fundamental law of Nepal. Any law inconsistent with this Constitution shall, to the extent of such inconsistency, be void.'"
        ),
        (
            "ART-1",
            "According to Article 1(2), whose duty is it to abide by the Constitution?",
            "Only elected government officials",
            "Every person in Nepal",
            "Only Supreme Court Justices",
            "Only permanent civil servants",
            "B",
            "Article 1(2) states: 'It shall be the duty of every person to abide by this Constitution.'"
        ),
        (
            "ART-3",
            "According to Article 3, how is the 'Nation' of Nepal characterized?",
            "A single linguistic community under one crown",
            "All the Nepalese people multi-ethnic, multi-lingual, multi-religious, multi-cultural having common aspirations",
            "Solely residents living within the Kathmandu Valley",
            "A federation of independent autonomous kingdoms",
            "B",
            "Article 3 defines the nation as all the Nepalese people bound together by common aspirations of national independence and prosperity."
        ),
        (
            "ART-4",
            "According to Article 4, what form of governance is Nepal defined as?",
            "A unitary absolute monarchy",
            "An independent, indivisible, sovereign, secular, inclusive, democratic, socialism-oriented, federal democratic republican state",
            "A constitutional confederation with executive monarchy",
            "An oligarchic military republic",
            "B",
            "Article 4 defines Nepal as an independent, indivisible, sovereign, secular, inclusive, democratic, socialism-oriented, federal democratic republican state."
        ),
        (
            "ART-7",
            "According to Article 7(1), what is the official language of government business in Nepal?",
            "Nepali language in Devanagari script",
            "English language in Latin script",
            "Any language designated by each ward office",
            "Sanskrit language in Devanagari script",
            "A",
            "Article 7(1) states: 'The Nepali language in the Devanagari script shall be the language of the business of the Government of Nepal.'"
        ),
        (
            "ART-9",
            "What are the national bird and national animal of Nepal under Article 9 and Schedule 3/4?",
            "Peacock and Rhino",
            "Danphe (Lophophorus) and Cow",
            "Falcon and Tiger",
            "Eagle and Snow Leopard",
            "B",
            "Under national symbols provisions, the Cow is the national animal and Danfe (Lophophorus) is the national bird of Nepal."
        ),
        (
            "ART-10",
            "According to Article 10(1), which guarantee is given regarding citizenship?",
            "Any citizen can be deprived of citizenship by executive order",
            "No citizen of Nepal shall be deprived of the right to obtain citizenship",
            "Dual citizenship is unconditionally provided to everyone",
            "Citizenship is renewable every 5 years",
            "B",
            "Article 10(1) states: 'No citizen of Nepal may be deprived of the right to obtain citizenship.'"
        ),
        (
            "ART-16",
            "Under Article 16 (Right to live with dignity), what law cannot be made regarding punishment?",
            "No fine exceeding 1 million rupees",
            "No law providing for the death penalty shall be made",
            "No imprisonment exceeding 10 years",
            "No community service requirements",
            "B",
            "Article 16(2) explicitly commands: 'No law providing for the death penalty shall be made.'"
        ),
        (
            "ART-17",
            "Which of the following is NOT one of the freedoms guaranteed under Article 17(2)?",
            "Freedom of opinion and expression",
            "Freedom to assemble peaceably and without arms",
            "Freedom to evade constitutional taxes",
            "Freedom to move and reside in any part of Nepal",
            "C",
            "Article 17(2) guarantees freedoms including speech, peaceful assembly, association, movement, and trade/occupation."
        ),
        (
            "ART-18",
            "What does Article 18 guarantee to all citizens?",
            "Right to hereditary titles",
            "All citizens shall be equal before law and get equal protection of law",
            "Unrestricted entry into any foreign diplomatic premises",
            "Freedom from civil lawsuits",
            "B",
            "Article 18 guarantees that all citizens shall be equal before law and shall have equal protection of law without discrimination."
        ),
        (
            "ART-21",
            "What right is guaranteed to victims of crime under Article 21?",
            "Right to inflict retributive punishment",
            "Right to information about investigation and right to justice including compensation",
            "Right to appoint their own judge",
            "Right to veto judicial appointments",
            "B",
            "Article 21 provides victims the right to information regarding crime investigation and trial, plus social rehabilitation and justice with compensation."
        ),
        (
            "ART-24",
            "What does Article 24 strictly prohibit and penalize?",
            "All forms of untouchability and discrimination",
            "Foreign capital investment",
            "Private tutoring and academies",
            "Peaceful strikes by organized labor",
            "A",
            "Article 24 establishes the Right against untouchability and discrimination in public and private spheres."
        ),
        (
            "ART-27",
            "Under Article 27 (Right to Information), what information is every citizen entitled to demand?",
            "Private bank statements of neighbors",
            "Information on matters of public importance or personal importance, except confidential matters protected by law",
            "State military troop positioning codes",
            "Judicial deliberations in camera",
            "B",
            "Article 27 provides citizens right to demand and receive information on matters of personal or public interest."
        ),
        (
            "ART-35",
            "What does Article 35 (Right relating to Health) provide regarding basic health care services?",
            "Only insured citizens receive emergency services",
            "Every citizen shall have the right to free basic health care services from the State and no one shall be deprived of emergency health care",
            "Basic healthcare is exclusively privatized",
            "Emergency care requires cash pre-payment",
            "B",
            "Article 35 guarantees free basic healthcare services and ensures no person shall be deprived of emergency healthcare."
        ),
        (
            "ART-46",
            "Under Article 46, how are fundamental rights enforced if violated?",
            "By appeal to international tribunals only",
            "By constitutional remedies provided in Article 133 or 144",
            "By street petitions to the Prime Minister",
            "Through mediation councils only",
            "B",
            "Article 46 states: 'There shall be a right to obtain constitutional remedies in the manner set out in Article 133 or 144 for the enforcement of the rights conferred by this Part.'"
        )
    ]

    # Prepend curated quizzes
    all_quizzes = curated_quizzes + quizzes_to_insert

    cursor.executemany("""
        INSERT INTO quiz_questions (article_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, all_quizzes)

    conn.commit()

    cursor.execute("SELECT COUNT(*) FROM quiz_questions")
    total_q = cursor.fetchone()[0]
    print(f"Successfully populated quiz_questions table with {total_q} questions across all 308 articles!")
    conn.close()

if __name__ == "__main__":
    generate_quizzes_for_all_articles()

import chromadb
import os
from django.conf import settings

DB_PATH = os.path.join(settings.BASE_DIR, "chroma_db")
client = chromadb.PersistentClient(path=DB_PATH)
collection = client.get_or_create_collection(name="grammar_rules")

def seed_knowledge_base():
    if collection.count() == 0:
        rules = [
            "Past Simple Tense: Use the past simple for actions that finished in the past. Example: 'I went to school yesterday' (NOT 'I go to school yesterday').",
            "Subject-Verb Agreement: A singular subject takes a singular verb. Example: 'He plays tennis' (NOT 'He play tennis').",
            "Articles: Use 'an' before words starting with a vowel sound. Example: 'an apple' (NOT 'a apple')."
        ]
        ids = ["rule_1", "rule_2", "rule_3"]
        
        try:
            # تلاش برای دانلود مدل و اضافه کردن به دیتابیس
            collection.add(documents=rules, ids=ids)
        except Exception as e:
            print(f"Network timeout during ChromaDB model download. Using Mock RAG. Error: {e}")

def retrieve_grammar_rule(error_text):
    try:
        # اگر دیتابیس خالی است، تلاش کن آن را پر کنی
        if collection.count() == 0:
            seed_knowledge_base()
            
        # تلاش برای جستجوی واقعی
        results = collection.query(
            query_texts=[error_text],
            n_results=1
        )
        
        if results.get('documents') and results['documents'][0]:
            return results['documents'][0][0]
            
    except Exception:
        # اگر اینترنت قطع بود یا دانلود مدل تایم‌اوت شد، این قانون تستی برمی‌گردد تا پروژه متوقف نشود
        return "Mock Rule (Network Timeout): Past Simple Tense is used for completed actions in the past."
        
    return "No specific grammar rule found in the knowledge base."
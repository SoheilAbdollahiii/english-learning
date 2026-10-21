import json
from decouple import config
from groq import Groq
from rag.knowledge_base import retrieve_grammar_rule

def analyze_text_with_llm(text):
    api_key = config('GROQ_API_KEY', default='')
    
    try:
        if not api_key:
            raise Exception("API Key is missing")
            
        client = Groq(api_key=api_key)
        prompt = f"""... (کد قبلی اینجا بود) ..."""
        # (به دلیل تحریم، این بخش فعلا به except پرش می‌کند)
        raise Exception("Forced to use mock due to 403")
        
    except Exception as e:
        # شبیه‌سازی کار هوش مصنوعی: فرض می‌کنیم کاربر زمان گذشته را اشتباه نوشته است
        mock_error = "I go to school yesterday"
        
        # جستجو در دیتابیس RAG بر اساس خطای پیدا شده
        rag_reference = retrieve_grammar_rule(mock_error)
        
        return [
            {
                "error": "go",
                "correction": "went",
                "reason": f"Terminal VPN issue. Mocking AI behavior. \n\n📚 RAG Reference: {rag_reference}"
            }
        ]
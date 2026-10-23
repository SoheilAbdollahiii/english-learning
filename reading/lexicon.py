"""Context-aware reading lookup helpers with graceful fallbacks for external dictionaries."""

import re

import requests
from django.core.cache import cache


COMMON_WORDS = {
    "notice": {"translation": "متوجه شدن؛ توجه کردن", "definition": "to see or become aware of something", "example": "She noticed a small light near the door.", "example_translation": "او متوجه نور کوچکی نزدیک در شد."},
    "reach": {"translation": "رسیدن؛ دست یافتن", "definition": "to arrive at a place or get to a point", "example": "We reached the station before noon.", "example_translation": "ما پیش از ظهر به ایستگاه رسیدیم."},
    "strange": {"translation": "عجیب؛ غیرعادی", "definition": "unusual or surprising, especially in a way that is difficult to explain", "example": "There was a strange sound outside.", "example_translation": "صدای عجیبی بیرون بود."},
    "quiet": {"translation": "ساکت؛ آرام", "definition": "making little or no noise", "example": "They found a quiet place to study.", "example_translation": "آن‌ها جای آرامی برای مطالعه پیدا کردند."},
    "carefully": {"translation": "با دقت؛ محتاطانه", "definition": "in a way that avoids mistakes or danger", "example": "Read the instructions carefully.", "example_translation": "دستورالعمل‌ها را با دقت بخوان."},
    "worried": {"translation": "نگران؛ دلواپس", "definition": "unhappy because you think something bad might happen", "example": "He was worried about the exam.", "example_translation": "او نگران امتحان بود."},
    "although": {"translation": "اگرچه؛ با اینکه", "definition": "used to introduce a contrast or something unexpected", "example": "Although it was late, they kept reading.", "example_translation": "اگرچه دیر شده بود، آن‌ها به خواندن ادامه دادند."},
    "however": {"translation": "بااین‌حال؛ اما", "definition": "used to introduce a statement that contrasts with what came before", "example": "The path was difficult. However, we continued.", "example_translation": "مسیر دشوار بود. بااین‌حال، ادامه دادیم."},
    "instead": {"translation": "در عوض؛ به‌جای آن", "definition": "as an alternative or replacement", "example": "We walked instead of taking a taxi.", "example_translation": "به‌جای تاکسی گرفتن، پیاده رفتیم."},
    "realize": {"translation": "فهمیدن؛ پی بردن", "definition": "to understand or become aware of something", "example": "I realized I had the wrong address.", "example_translation": "فهمیدم نشانی اشتباهی داشتم."},
    "improve": {"translation": "بهبود دادن؛ بهتر شدن", "definition": "to make or become better", "example": "Reading daily can improve your vocabulary.", "example_translation": "مطالعه روزانه می‌تواند دایره واژگان شما را بهتر کند."},
    "journey": {"translation": "سفر؛ مسیر", "definition": "the act of travelling from one place to another", "example": "Their journey took three days.", "example_translation": "سفر آن‌ها سه روز طول کشید."},
    "available": {"translation": "در دسترس؛ موجود", "definition": "able to be used or obtained", "example": "The book is available online.", "example_translation": "کتاب به‌صورت آنلاین در دسترس است."},
    "decision": {"translation": "تصمیم", "definition": "a choice you make after thinking about something", "example": "It was a difficult decision to make.", "example_translation": "گرفتن آن تصمیم دشوار بود."},
    "discover": {"translation": "کشف کردن؛ پی بردن", "definition": "to find something or learn something for the first time", "example": "They discovered a hidden path.", "example_translation": "آن‌ها مسیر پنهانی را کشف کردند."},
    "provide": {"translation": "فراهم کردن؛ ارائه دادن", "definition": "to give someone something they need", "example": "The guide provided useful information.", "example_translation": "راهنما اطلاعات مفیدی ارائه داد."},
    "support": {"translation": "حمایت کردن؛ پشتیبانی", "definition": "to help or encourage someone or something", "example": "Friends can support each other.", "example_translation": "دوستان می‌توانند از یکدیگر حمایت کنند."},
    "avoid": {"translation": "اجتناب کردن؛ دوری کردن", "definition": "to stay away from something or prevent it from happening", "example": "Try to avoid making the same mistake.", "example_translation": "سعی کن از تکرار همان اشتباه پرهیز کنی."},
    "calm": {"translation": "آرام؛ خونسرد", "definition": "not excited, nervous, or upset", "example": "She stayed calm during the problem.", "example_translation": "او هنگام بروز مشکل آرامش خود را حفظ کرد."},
    "promise": {"translation": "قول؛ قول دادن", "definition": "to tell someone you will definitely do something", "example": "He promised to call after work.", "example_translation": "او قول داد بعد از کار تماس بگیرد."},
    "stranded": {"translation": "در راه مانده؛ گرفتار", "definition": "unable to leave a place because you have no transport or help", "example": "The stranded travelers asked for help.", "example_translation": "مسافرانِ درراه‌مانده درخواست کمک کردند."},
    "glance": {"translation": "نگاه کوتاه؛ نگاهی انداختن", "definition": "to look quickly at someone or something", "example": "She glanced at the clock.", "example_translation": "او نگاهی به ساعت انداخت."},
    "likely": {"translation": "محتمل؛ به‌احتمال زیاد", "definition": "probable or expected to happen", "example": "It is likely to rain this evening.", "example_translation": "احتمالاً امشب باران می‌بارد."},
    "common": {"translation": "رایج؛ معمول", "definition": "happening often or found frequently", "example": "This is a common expression in English.", "example_translation": "این عبارت در انگلیسی رایج است."},
    "meanwhile": {"translation": "در همین حین؛ در این فاصله", "definition": "during the time that something else is happening", "example": "Meanwhile, the others prepared dinner.", "example_translation": "در همین حین، بقیه شام را آماده کردند."},
    "eventually": {"translation": "سرانجام؛ در نهایت", "definition": "in the end, especially after a long time", "example": "They eventually found the right road.", "example_translation": "آن‌ها سرانجام مسیر درست را پیدا کردند."},
    "figure": {"translation": "شکل؛ رقم؛ فهمیدن (در عبارت figure out)", "definition": "a number or shape; in 'figure out', to understand or solve something", "example": "We need to figure out what happened.", "example_translation": "باید بفهمیم چه اتفاقی افتاده است."},
    "point": {"translation": "نکته؛ منظور؛ اشاره کردن", "definition": "an idea, detail, or purpose; meaning depends on context", "example": "You have a good point.", "example_translation": "نکته خوبی گفتی."},
    "issue": {"translation": "موضوع؛ مسئله؛ مشکل", "definition": "an important subject or a problem that needs attention", "example": "Let's discuss the main issue.", "example_translation": "بیایید درباره مسئله اصلی صحبت کنیم."},
    "set": {"translation": "گذاشتن؛ مجموعه؛ تنظیم کردن", "definition": "a very common word with several meanings; use the surrounding sentence to choose the right one", "example": "She set the book on the table.", "example_translation": "او کتاب را روی میز گذاشت."},
}

PHRASES = {
    "find out": {"translation": "فهمیدن؛ پی بردن", "definition": "to discover information or learn the truth", "example": "I need to find out when the train leaves.", "example_translation": "باید بفهمم قطار چه زمانی حرکت می‌کند."},
    "figure out": {"translation": "فهمیدن؛ حل کردن", "definition": "to understand something or find an answer to a problem", "example": "We figured out how to open the door.", "example_translation": "فهمیدیم چطور در را باز کنیم."},
    "look for": {"translation": "دنبالِ چیزی گشتن", "definition": "to try to find someone or something", "example": "She is looking for her keys.", "example_translation": "او دنبال کلیدهایش می‌گردد."},
    "look after": {"translation": "مراقبت کردن از", "definition": "to take care of someone or something", "example": "Can you look after my bag?", "example_translation": "می‌توانی مراقب کیفم باشی؟"},
    "give up": {"translation": "تسلیم شدن؛ دست کشیدن", "definition": "to stop trying or stop doing something", "example": "Don't give up when English feels difficult.", "example_translation": "وقتی انگلیسی دشوار به نظر می‌رسد، تسلیم نشو."},
    "carry on": {"translation": "ادامه دادن", "definition": "to continue doing something", "example": "Please carry on with your work.", "example_translation": "لطفاً به کارت ادامه بده."},
    "run out of": {"translation": "تمام کردن؛ دیگر نداشتن", "definition": "to use all of something so that none is left", "example": "We ran out of time.", "example_translation": "وقت‌مان تمام شد."},
    "take care of": {"translation": "مراقبت کردن از؛ رسیدگی کردن به", "definition": "to look after someone or deal with a task", "example": "I'll take care of the booking.", "example_translation": "من رسیدگی به رزرو را انجام می‌دهم."},
    "as soon as": {"translation": "به‌محض اینکه", "definition": "immediately after something happens", "example": "Call me as soon as you arrive.", "example_translation": "به‌محض اینکه رسیدی به من زنگ بزن."},
    "even though": {"translation": "با اینکه؛ هرچند", "definition": "despite the fact that", "example": "Even though it was raining, we walked home.", "example_translation": "با اینکه باران می‌بارید، پیاده به خانه رفتیم."},
    "in order to": {"translation": "برای اینکه؛ به‌منظورِ", "definition": "for the purpose of doing something", "example": "She studies every day in order to improve.", "example_translation": "او هر روز درس می‌خواند تا پیشرفت کند."},
    "at the moment": {"translation": "در حال حاضر؛ همین الآن", "definition": "now or at the present time", "example": "I'm busy at the moment.", "example_translation": "در حال حاضر سرم شلوغ است."},
    "on the other hand": {"translation": "از طرف دیگر؛ در مقابل", "definition": "used to introduce a contrasting point of view", "example": "The job pays well; on the other hand, it is stressful.", "example_translation": "این شغل درآمد خوبی دارد؛ از طرف دیگر، پراسترس است."},
    "a little": {"translation": "کمی؛ اندکی", "definition": "a small amount or degree", "example": "I need a little more time.", "example_translation": "کمی زمان بیشتر لازم دارم."},
    "a lot of": {"translation": "مقدار زیادی؛ تعداد زیادی", "definition": "a large amount or number of something", "example": "She has a lot of experience.", "example_translation": "او تجربه زیادی دارد."},
    "look forward to": {"translation": "مشتاقِ چیزی بودن؛ بی‌صبرانه منتظر بودن", "definition": "to feel pleased and excited about something that is going to happen", "example": "I look forward to meeting you.", "example_translation": "مشتاق دیدار شما هستم."},
    "make sure": {"translation": "مطمئن شدن؛ اطمینان حاصل کردن", "definition": "to check that something is true or will happen", "example": "Make sure the door is locked.", "example_translation": "مطمئن شو که در قفل است."},
    "by the way": {"translation": "راستی؛ ضمناً", "definition": "used to introduce an extra piece of information", "example": "By the way, I found your book.", "example_translation": "راستی، کتابت را پیدا کردم."},
    "get along": {"translation": "کنار آمدن؛ رابطه خوبی داشتن", "definition": "to have a friendly relationship with someone", "example": "They get along very well.", "example_translation": "آن‌ها خیلی خوب با هم کنار می‌آیند."},
    "turn out": {"translation": "از آب درآمدن؛ معلوم شدن", "definition": "to develop in a particular way or be discovered to be true", "example": "The story turned out to be true.", "example_translation": "معلوم شد داستان حقیقت دارد."},
    "keep in mind": {"translation": "به خاطر داشتن؛ در نظر گرفتن", "definition": "to remember or consider something important", "example": "Keep in mind that practice takes time.", "example_translation": "به خاطر داشته باش که تمرین زمان می‌برد."},
    "come up with": {"translation": "به ذهن رسیدن؛ ابداع کردن", "definition": "to think of an idea, plan, or solution", "example": "She came up with a clever solution.", "example_translation": "او راه‌حل هوشمندانه‌ای پیدا کرد."},
    "deal with": {"translation": "رسیدگی کردن به؛ کنار آمدن با", "definition": "to take action to solve a problem or manage a situation", "example": "We need to deal with this problem.", "example_translation": "باید به این مشکل رسیدگی کنیم."},
    "pay attention": {"translation": "توجه کردن", "definition": "to watch, listen, or think carefully about something", "example": "Pay attention to the ending of the story.", "example_translation": "به پایان داستان توجه کن."},
}


def _dictionary_entry(term):
    normalized = term.lower().strip()
    if normalized in PHRASES:
        return {**PHRASES[normalized], "term_type": "phrase"}
    if normalized in COMMON_WORDS:
        return {**COMMON_WORDS[normalized], "term_type": "word"}
    cache_key = "reading_dictionary_v2:" + normalized
    cached = cache.get(cache_key)
    if cached:
        # A temporary translation outage must not poison the dictionary cache
        # with a permanently empty Persian meaning.
        if not cached.get("translation"):
            cached["translation"] = _translate_to_persian(normalized)
            if cached["translation"]:
                cache.set(cache_key, cached, 60 * 60 * 24)
        return cached
    entry = None
    try:
        response = requests.get(
            "https://api.dictionaryapi.dev/api/v2/entries/en/" + requests.utils.quote(normalized, safe=""),
            timeout=2.5,
        )
        if response.ok:
            payload = response.json()
            first = payload[0] if isinstance(payload, list) and payload and isinstance(payload[0], dict) else {}
            meanings = first.get("meanings", [])
            parsed_meanings = []
            api_synonyms = []
            api_antonyms = []
            for meaning in meanings if isinstance(meanings, list) else []:
                if not isinstance(meaning, dict):
                    continue
                part_of_speech = meaning.get("partOfSpeech", "")
                definitions = meaning.get("definitions", [])
                for definition in definitions if isinstance(definitions, list) else []:
                    if not isinstance(definition, dict) or not definition.get("definition"):
                        continue
                    example = definition.get("example", "")
                    parsed_meanings.append({
                        "part_of_speech": part_of_speech,
                        "definition": definition.get("definition", ""),
                        "example": example,
                        "example_translation": _translate_to_persian(example) if example else "",
                    })
                    api_synonyms.extend(definition.get("synonyms", []) if isinstance(definition.get("synonyms"), list) else [])
                    api_antonyms.extend(definition.get("antonyms", []) if isinstance(definition.get("antonyms"), list) else [])
                api_synonyms.extend(meaning.get("synonyms", []) if isinstance(meaning.get("synonyms"), list) else [])
                api_antonyms.extend(meaning.get("antonyms", []) if isinstance(meaning.get("antonyms"), list) else [])
            phonetics = first.get("phonetics", [])
            phonetic = next((item.get("text", "") for item in phonetics if isinstance(item, dict) and item.get("text")), "") if isinstance(phonetics, list) else ""
            entry = {
                "definition": parsed_meanings[0]["definition"] if parsed_meanings else "",
                "translation": "",
                "example": parsed_meanings[0]["example"] if parsed_meanings else "",
                "example_translation": parsed_meanings[0]["example_translation"] if parsed_meanings else "",
                "term_type": "phrase" if " " in normalized else "word",
                "part_of_speech": parsed_meanings[0]["part_of_speech"] if parsed_meanings else "",
                "meanings": parsed_meanings[:8],
                "phonetic": phonetic,
                "synonyms": list(dict.fromkeys(api_synonyms))[:12],
                "antonyms": list(dict.fromkeys(api_antonyms))[:12],
            }
            if not entry["definition"]:
                entry = None
    except (requests.RequestException, ValueError, TypeError, IndexError):
        entry = None
    if entry:
        # The dictionary API supplies English definitions, not Persian meanings.
        # Translate the headword separately so non-curated vocabulary is useful too.
        if not entry.get("translation"):
            entry["translation"] = _translate_to_persian(normalized)
        cache.set(cache_key, entry, 60 * 60 * 24)
        return entry
    fallback = {
        "definition": "Meaning depends on how this word is used in the sentence. Read the context and try the example.",
        "translation": _translate_to_persian(normalized),
        "example": "",
        "example_translation": "",
        "term_type": "phrase" if " " in normalized else "word",
    }
    cache.set(cache_key, fallback, 60 * 60 * 24)
    return fallback


def _translate_to_persian(text):
    text = " ".join(text.split()).strip()
    if not text:
        return ""
    cache_key = "reading_translation_v2:" + text
    cached = cache.get(cache_key)
    if cached:
        return cached
    try:
        response = requests.get(
            "https://translate.googleapis.com/translate_a/single",
            params={"client": "gtx", "sl": "en", "tl": "fa", "dt": "t", "q": text},
            headers={"User-Agent": "Mozilla/5.0 EnglishLearningStudio/1.0"},
            timeout=3.5,
        )
        if response.ok:
            payload = response.json()
            segments = payload[0] if isinstance(payload, list) and payload else []
            translated = "".join(
                part[0]
                for part in segments
                if isinstance(part, list) and part and isinstance(part[0], str)
            )
            if translated.strip():
                translated = translated.strip()
                cache.set(cache_key, translated, 60 * 60 * 12)
                return translated
    except (requests.RequestException, ValueError, TypeError, IndexError, KeyError):
        pass

    # Secondary provider keeps translations available when Google's public endpoint
    # is blocked or rate-limited. Keep the same strict timeout and fail gracefully.
    try:
        response = requests.get(
            "https://api.mymemory.translated.net/get",
            params={"q": text[:500], "langpair": "en|fa"},
            headers={"User-Agent": "EnglishLearningStudio/1.0"},
            timeout=3.5,
        )
        if response.ok:
            payload = response.json()
            result = payload.get("responseData", {}) if isinstance(payload, dict) else {}
            translated = result.get("translatedText", "") if isinstance(result, dict) else ""
            if isinstance(translated, str) and translated.strip() and payload.get("responseStatus", 200) == 200:
                from html import unescape

                translated = unescape(translated).strip()
                cache.set(cache_key, translated, 60 * 60 * 12)
                return translated
    except (requests.RequestException, ValueError, TypeError, IndexError, KeyError):
        pass
    return ""


WORD_DETAILS = {
    "later": {"level": "A2", "phonetic": "/ˈleɪtər/", "synonyms": ["afterward", "subsequently"], "antonyms": ["earlier", "before"], "collocations": ["later today", "sooner or later", "ten minutes later"]},
    "notice": {"level": "B1", "phonetic": "/ˈnoʊtɪs/", "synonyms": ["observe", "spot"], "antonyms": ["ignore", "overlook"], "collocations": ["notice a difference", "notice a change", "take notice"]},
    "reach": {"level": "B1", "phonetic": "/riːtʃ/", "synonyms": ["arrive at", "get to"], "antonyms": ["leave"], "collocations": ["reach a goal", "reach an agreement", "reach out"]},
    "strange": {"level": "B1", "phonetic": "/streɪndʒ/", "synonyms": ["unusual", "odd"], "antonyms": ["normal", "ordinary"], "collocations": ["strange feeling", "strange noise", "strange behavior"]},
    "quiet": {"level": "A2", "phonetic": "/ˈkwaɪət/", "synonyms": ["silent", "peaceful"], "antonyms": ["noisy", "loud"], "collocations": ["quiet place", "keep quiet", "quiet voice"]},
    "realize": {"level": "B1", "phonetic": "/ˈriːəlaɪz/", "synonyms": ["recognize", "understand"], "antonyms": ["misunderstand"], "collocations": ["realize a mistake", "suddenly realize", "realize that"]},
    "improve": {"level": "A2", "phonetic": "/ɪmˈpruːv/", "synonyms": ["enhance", "develop"], "antonyms": ["worsen", "decline"], "collocations": ["improve skills", "improve performance", "improve your English"]},
    "journey": {"level": "A2", "phonetic": "/ˈdʒɜːrni/", "synonyms": ["trip", "voyage"], "antonyms": [], "collocations": ["long journey", "journey home", "journey through life"]},
    "available": {"level": "B1", "phonetic": "/əˈveɪləbl/", "synonyms": ["accessible", "obtainable"], "antonyms": ["unavailable"], "collocations": ["available online", "readily available", "available to everyone"]},
    "decision": {"level": "B1", "phonetic": "/dɪˈsɪʒən/", "synonyms": ["choice", "verdict"], "antonyms": ["indecision"], "collocations": ["make a decision", "final decision", "difficult decision"]},
    "discover": {"level": "B1", "phonetic": "/dɪˈskʌvər/", "synonyms": ["find", "uncover"], "antonyms": ["conceal"], "collocations": ["discover a fact", "discover a place", "discover that"]},
    "provide": {"level": "B1", "phonetic": "/prəˈvaɪd/", "synonyms": ["supply", "offer"], "antonyms": ["withhold"], "collocations": ["provide information", "provide support", "provide someone with"]},
    "support": {"level": "A2", "phonetic": "/səˈpɔːrt/", "synonyms": ["help", "assist"], "antonyms": ["oppose", "undermine"], "collocations": ["support a friend", "support a decision", "technical support"]},
}


def lookup_reading_text(term, sentence):
    entry = _dictionary_entry(term) if term else {}
    sentence_translation = _translate_to_persian(sentence)
    details = WORD_DETAILS.get((term or "").lower(), {})
    return {
        "term": term,
        "term_type": entry.get("term_type", "sentence" if not term else "word"),
        "translation": entry.get("translation", ""),
        "definition": entry.get("definition", ""),
        "part_of_speech": entry.get("part_of_speech", ""),
        "phonetic": details.get("phonetic") or entry.get("phonetic", ""),
        "meanings": entry.get("meanings") or ([{"part_of_speech": entry.get("part_of_speech", ""), "definition": entry.get("definition", ""), "example": entry.get("example", ""), "example_translation": entry.get("example_translation", "")}] if entry.get("definition") else []),
        "synonyms": details.get("synonyms") or entry.get("synonyms", []),
        "antonyms": details.get("antonyms") or entry.get("antonyms", []),
        "collocations": details.get("collocations", []),
        "level": details.get("level", "B1"),
        "example": entry.get("example", ""),
        "example_translation": entry.get("example_translation", ""),
        "sentence": sentence,
        "sentence_translation": sentence_translation,
        "translation_available": bool(sentence_translation),
        "related_phrases": [
            {"phrase": phrase, **details}
            for phrase, details in PHRASES.items()
            if phrase in sentence.lower() and phrase != term.lower()
        ][:6],
    }

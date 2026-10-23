from django.db import migrations


WORDS = [
    ("achieve", "دست یافتن", "B1"),
    ("advice", "توصیه", "A1"),
    ("arrive", "رسیدن", "A1"),
    ("borrow", "قرض گرفتن", "A1"),
    ("brave", "شجاع", "A1"),
    ("calm", "آرام", "A1"),
    ("challenge", "چالش", "B1"),
    ("choose", "انتخاب کردن", "A1"),
    ("confident", "بااعتمادبه‌نفس", "B1"),
    ("curious", "کنجکاو", "A1"),
    ("decide", "تصمیم گرفتن", "A1"),
    ("discover", "کشف کردن", "B1"),
    ("effort", "تلاش", "B1"),
    ("environment", "محیط زیست", "B1"),
    ("improve", "بهبود دادن", "B1"),
    ("journey", "سفر", "A1"),
    ("knowledge", "دانش", "B1"),
    ("opportunity", "فرصت", "B1"),
    ("patient", "صبور", "A1"),
    ("protect", "محافظت کردن", "B1"),
    ("reliable", "قابل اعتماد", "C1"),
    ("share", "به اشتراک گذاشتن", "A1"),
    ("support", "حمایت کردن", "B1"),
    ("valuable", "ارزشمند", "B1"),
    ("wonder", "تعجب کردن", "B1"),
]


def seed_words(apps, schema_editor):
    Word = apps.get_model("vocabulary", "Word")
    for english_word, translation, level in WORDS:
        Word.objects.get_or_create(
            english_word=english_word,
            defaults={"translation": translation, "level": level, "proficiency": 0},
        )


class Migration(migrations.Migration):
    dependencies = [("vocabulary", "0003_userword")]
    operations = [migrations.RunPython(seed_words, migrations.RunPython.noop)]

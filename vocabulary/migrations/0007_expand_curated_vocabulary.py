"""Add an expanded, original English–Persian vocabulary collection.

Selection and level design are informed by public Oxford Learner's Dictionaries
word-list methodology and CEFR level descriptions. Entries and Persian glosses
here are editorially authored; this is not a copied or official Oxford list.
Sources: https://www.oxfordlearnersdictionaries.com/about/wordlists/
         https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors
"""
from django.db import migrations


WORDS = [
    [
        "address",
        "نشانی",
        "A1"
    ],
    [
        "airport",
        "فرودگاه",
        "A1"
    ],
    [
        "animal",
        "حیوان",
        "A1"
    ],
    [
        "apartment",
        "آپارتمان",
        "A1"
    ],
    [
        "arrive",
        "رسیدن",
        "A1"
    ],
    [
        "ask",
        "پرسیدن",
        "A1"
    ],
    [
        "bakery",
        "نانوایی",
        "A1"
    ],
    [
        "bathroom",
        "حمام؛ دستشویی",
        "A1"
    ],
    [
        "beautiful",
        "زیبا",
        "A1"
    ],
    [
        "behind",
        "پشتِ",
        "A1"
    ],
    [
        "between",
        "بینِ",
        "A1"
    ],
    [
        "bicycle",
        "دوچرخه",
        "A1"
    ],
    [
        "birthday",
        "تولد",
        "A1"
    ],
    [
        "blanket",
        "پتو",
        "A1"
    ],
    [
        "bookshop",
        "کتاب‌فروشی",
        "A1"
    ],
    [
        "bottle",
        "بطری",
        "A1"
    ],
    [
        "borrow",
        "قرض گرفتن",
        "A1"
    ],
    [
        "bowl",
        "کاسه",
        "A1"
    ],
    [
        "bridge",
        "پل",
        "A1"
    ],
    [
        "building",
        "ساختمان",
        "A1"
    ],
    [
        "busy",
        "مشغول؛ پررفت‌وآمد",
        "A1"
    ],
    [
        "calendar",
        "تقویم",
        "A1"
    ],
    [
        "careful",
        "مراقب",
        "A1"
    ],
    [
        "carrot",
        "هویج",
        "A1"
    ],
    [
        "ceiling",
        "سقف",
        "A1"
    ],
    [
        "cheap",
        "ارزان",
        "A1"
    ],
    [
        "choose",
        "انتخاب کردن",
        "A1"
    ],
    [
        "cinema",
        "سینما",
        "A1"
    ],
    [
        "classroom",
        "کلاس درس",
        "A1"
    ],
    [
        "cloudy",
        "ابری",
        "A1"
    ],
    [
        "comfortable",
        "راحت",
        "A1"
    ],
    [
        "cook",
        "آشپزی کردن",
        "A1"
    ],
    [
        "corner",
        "گوشه؛ نبش",
        "A1"
    ],
    [
        "dangerous",
        "خطرناک",
        "A1"
    ],
    [
        "different",
        "متفاوت",
        "A1"
    ],
    [
        "difficult",
        "دشوار",
        "A1"
    ],
    [
        "dinner",
        "شام",
        "A1"
    ],
    [
        "drawer",
        "کشو",
        "A1"
    ],
    [
        "driver",
        "راننده",
        "A1"
    ],
    [
        "during",
        "در طولِ",
        "A1"
    ],
    [
        "each",
        "هر یک",
        "A1"
    ],
    [
        "enjoy",
        "لذت بردن",
        "A1"
    ],
    [
        "expensive",
        "گران",
        "A1"
    ],
    [
        "famous",
        "مشهور",
        "A1"
    ],
    [
        "farm",
        "مزرعه",
        "A1"
    ],
    [
        "floor",
        "کف؛ طبقه",
        "A1"
    ],
    [
        "friendly",
        "خوش‌برخورد",
        "A1"
    ],
    [
        "garden",
        "باغ؛ باغچه",
        "A1"
    ],
    [
        "glasses",
        "عینک",
        "A1"
    ],
    [
        "grandparent",
        "پدربزرگ یا مادربزرگ",
        "A1"
    ],
    [
        "guest",
        "مهمان",
        "A1"
    ],
    [
        "hobby",
        "سرگرمی",
        "A1"
    ],
    [
        "holiday",
        "تعطیلات",
        "A1"
    ],
    [
        "hospital",
        "بیمارستان",
        "A1"
    ],
    [
        "hungry",
        "گرسنه",
        "A1"
    ],
    [
        "kitchen",
        "آشپزخانه",
        "A1"
    ],
    [
        "library",
        "کتابخانه",
        "A1"
    ],
    [
        "market",
        "بازار",
        "A1"
    ],
    [
        "neighbour",
        "همسایه",
        "A1"
    ],
    [
        "quiet",
        "ساکت",
        "A1"
    ],
    [
        "usually",
        "معمولاً",
        "A1"
    ],
    [
        "achieve",
        "دستیابی پیدا کردن",
        "B1"
    ],
    [
        "advantage",
        "مزیت",
        "B1"
    ],
    [
        "advertise",
        "تبلیغ کردن",
        "B1"
    ],
    [
        "afford",
        "از عهدهٔ هزینه برآمدن",
        "B1"
    ],
    [
        "although",
        "اگرچه",
        "B1"
    ],
    [
        "amount",
        "مقدار",
        "B1"
    ],
    [
        "announce",
        "اعلام کردن",
        "B1"
    ],
    [
        "apologize",
        "عذرخواهی کردن",
        "B1"
    ],
    [
        "appointment",
        "قرار ملاقات",
        "B1"
    ],
    [
        "argue",
        "بحث کردن؛ استدلال کردن",
        "B1"
    ],
    [
        "avoid",
        "اجتناب کردن",
        "B1"
    ],
    [
        "behaviour",
        "رفتار",
        "B1"
    ],
    [
        "belong",
        "تعلق داشتن",
        "B1"
    ],
    [
        "brilliant",
        "درخشان؛ عالی",
        "B1"
    ],
    [
        "cancel",
        "لغو کردن",
        "B1"
    ],
    [
        "career",
        "مسیر شغلی",
        "B1"
    ],
    [
        "cause",
        "باعث شدن؛ علت",
        "B1"
    ],
    [
        "celebrate",
        "جشن گرفتن",
        "B1"
    ],
    [
        "challenge",
        "چالش",
        "B1"
    ],
    [
        "choice",
        "انتخاب",
        "B1"
    ],
    [
        "common",
        "رایج؛ مشترک",
        "B1"
    ],
    [
        "complain",
        "شکایت کردن",
        "B1"
    ],
    [
        "condition",
        "وضعیت؛ شرط",
        "B1"
    ],
    [
        "confident",
        "بااعتمادبه‌نفس",
        "B1"
    ],
    [
        "connect",
        "وصل کردن؛ ارتباط دادن",
        "B1"
    ],
    [
        "contain",
        "در بر داشتن",
        "B1"
    ],
    [
        "continue",
        "ادامه دادن",
        "B1"
    ],
    [
        "contribute",
        "مشارکت کردن؛ کمک کردن",
        "B1"
    ],
    [
        "create",
        "ایجاد کردن",
        "B1"
    ],
    [
        "decision",
        "تصمیم",
        "B1"
    ],
    [
        "deliver",
        "تحویل دادن",
        "B1"
    ],
    [
        "depend",
        "بستگی داشتن",
        "B1"
    ],
    [
        "detail",
        "جزئیات",
        "B1"
    ],
    [
        "discover",
        "کشف کردن",
        "B1"
    ],
    [
        "education",
        "آموزش",
        "B1"
    ],
    [
        "effort",
        "تلاش",
        "B1"
    ],
    [
        "emergency",
        "وضعیت اضطراری",
        "B1"
    ],
    [
        "environment",
        "محیط زیست؛ محیط",
        "B1"
    ],
    [
        "expect",
        "انتظار داشتن",
        "B1"
    ],
    [
        "explain",
        "توضیح دادن",
        "B1"
    ],
    [
        "fail",
        "شکست خوردن؛ مردود شدن",
        "B1"
    ],
    [
        "feature",
        "ویژگی",
        "B1"
    ],
    [
        "foreign",
        "خارجی",
        "B1"
    ],
    [
        "freedom",
        "آزادی",
        "B1"
    ],
    [
        "goal",
        "هدف",
        "B1"
    ],
    [
        "growth",
        "رشد",
        "B1"
    ],
    [
        "improve",
        "بهبود دادن",
        "B1"
    ],
    [
        "increase",
        "افزایش دادن؛ افزایش یافتن",
        "B1"
    ],
    [
        "instead",
        "در عوض",
        "B1"
    ],
    [
        "introduce",
        "معرفی کردن",
        "B1"
    ],
    [
        "knowledge",
        "دانش",
        "B1"
    ],
    [
        "local",
        "محلی",
        "B1"
    ],
    [
        "mention",
        "اشاره کردن",
        "B1"
    ],
    [
        "opportunity",
        "فرصت",
        "B1"
    ],
    [
        "perform",
        "اجرا کردن؛ عملکرد داشتن",
        "B1"
    ],
    [
        "perhaps",
        "شاید",
        "B1"
    ],
    [
        "provide",
        "فراهم کردن",
        "B1"
    ],
    [
        "purpose",
        "هدف؛ منظور",
        "B1"
    ],
    [
        "receive",
        "دریافت کردن",
        "B1"
    ],
    [
        "recent",
        "اخیر",
        "B1"
    ],
    [
        "refuse",
        "رد کردن؛ امتناع کردن",
        "B1"
    ],
    [
        "abolish",
        "لغو کردن؛ برانداختن",
        "C1"
    ],
    [
        "abstract",
        "انتزاعی؛ چکیده",
        "C1"
    ],
    [
        "accommodate",
        "جا دادن؛ سازگار شدن با",
        "C1"
    ],
    [
        "accumulate",
        "انباشت کردن",
        "C1"
    ],
    [
        "advocate",
        "حمایت یا دفاع کردن از",
        "C1"
    ],
    [
        "allocate",
        "تخصیص دادن",
        "C1"
    ],
    [
        "alter",
        "تغییر دادن",
        "C1"
    ],
    [
        "analogy",
        "قیاس؛ تشبیه",
        "C1"
    ],
    [
        "anticipate",
        "پیش‌بینی کردن",
        "C1"
    ],
    [
        "arbitrary",
        "دلبخواهی؛ بدون معیار روشن",
        "C1"
    ],
    [
        "articulate",
        "روشن و دقیق بیان کردن",
        "C1"
    ],
    [
        "attain",
        "به دست آوردن",
        "C1"
    ],
    [
        "attribute",
        "نسبت دادن؛ ویژگی",
        "C1"
    ],
    [
        "bias",
        "سوگیری",
        "C1"
    ],
    [
        "capacity",
        "ظرفیت؛ توانایی",
        "C1"
    ],
    [
        "cease",
        "متوقف شدن",
        "C1"
    ],
    [
        "clarify",
        "روشن کردن",
        "C1"
    ],
    [
        "coincide",
        "هم‌زمان یا منطبق بودن",
        "C1"
    ],
    [
        "compile",
        "گردآوری کردن",
        "C1"
    ],
    [
        "complement",
        "تکمیل کردن؛ مکمل",
        "C1"
    ],
    [
        "comprise",
        "شامل بودن",
        "C1"
    ],
    [
        "concede",
        "پذیرفتن؛ اذعان کردن",
        "C1"
    ],
    [
        "conceive",
        "تصور کردن",
        "C1"
    ],
    [
        "concurrent",
        "هم‌زمان",
        "C1"
    ],
    [
        "confine",
        "محدود کردن",
        "C1"
    ],
    [
        "contradict",
        "تناقض داشتن با",
        "C1"
    ],
    [
        "controversy",
        "مناقشه",
        "C1"
    ],
    [
        "convey",
        "منتقل کردن؛ رساندن",
        "C1"
    ],
    [
        "criterion",
        "معیار",
        "C1"
    ],
    [
        "deduce",
        "استنتاج کردن",
        "C1"
    ],
    [
        "deficiency",
        "کمبود",
        "C1"
    ],
    [
        "demonstrate",
        "نشان دادن؛ اثبات کردن",
        "C1"
    ],
    [
        "denote",
        "دلالت کردن بر",
        "C1"
    ],
    [
        "diminish",
        "کاهش یافتن؛ کم کردن",
        "C1"
    ],
    [
        "disclose",
        "افشا کردن؛ آشکار ساختن",
        "C1"
    ],
    [
        "discrete",
        "جداگانه؛ مجزا",
        "C1"
    ],
    [
        "elaborate",
        "با جزئیات توضیح دادن",
        "C1"
    ],
    [
        "empirical",
        "تجربی؛ مبتنی بر مشاهده",
        "C1"
    ],
    [
        "encompass",
        "در بر گرفتن",
        "C1"
    ],
    [
        "exceed",
        "فراتر رفتن از",
        "C1"
    ],
    [
        "explicit",
        "صریح",
        "C1"
    ],
    [
        "feasible",
        "عملی و امکان‌پذیر",
        "C1"
    ],
    [
        "fluctuate",
        "نوسان کردن",
        "C1"
    ],
    [
        "formulate",
        "صورت‌بندی کردن",
        "C1"
    ],
    [
        "framework",
        "چارچوب",
        "C1"
    ],
    [
        "hierarchy",
        "سلسله‌مراتب",
        "C1"
    ],
    [
        "inherent",
        "ذاتی",
        "C1"
    ],
    [
        "integral",
        "ضروری و جدایی‌ناپذیر",
        "C1"
    ],
    [
        "invoke",
        "استناد کردن به؛ فراخواندن",
        "C1"
    ],
    [
        "manifest",
        "آشکار کردن؛ آشکار",
        "C1"
    ],
    [
        "nevertheless",
        "با این حال",
        "C1"
    ],
    [
        "notion",
        "مفهوم؛ تصور",
        "C1"
    ],
    [
        "obtain",
        "به دست آوردن",
        "C1"
    ],
    [
        "offset",
        "جبران کردن؛ خنثی کردن",
        "C1"
    ],
    [
        "ongoing",
        "در حال انجام",
        "C1"
    ],
    [
        "paradigm",
        "الگو؛ پارادایم",
        "C1"
    ],
    [
        "preliminary",
        "مقدماتی",
        "C1"
    ],
    [
        "reluctant",
        "بی‌میل",
        "C1"
    ],
    [
        "rigorous",
        "دقیق و سخت‌گیرانه",
        "C1"
    ]
]


def seed_words(apps, schema_editor):
    Word = apps.get_model("vocabulary", "Word")
    for english_word, translation, level in WORDS:
        Word.objects.get_or_create(
            english_word=english_word,
            defaults={"translation": translation, "level": level, "proficiency": 0},
        )


class Migration(migrations.Migration):
    dependencies = [("vocabulary", "0006_expand_curated_words")]
    operations = [migrations.RunPython(seed_words, migrations.RunPython.noop)]

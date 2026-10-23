from django.db import migrations


ARTICLES = [
    ("The Morning Market", "Every Saturday, Lina visits the local market with her father. They buy fresh apples, bread, and vegetables. Lina likes speaking with the sellers because she learns something new each time.", "A1"),
    ("A Small Garden", "Omar has a small garden behind his home. He waters the plants before breakfast and removes weeds every weekend. After a few months, tomatoes and herbs begin to grow.", "A1"),
    ("A Train Journey", "Nina takes the train to visit her cousin in another city. She brings a book, checks the timetable, and arrives at the station early. During the journey, she enjoys watching the changing landscape.", "A1"),
    ("Learning Languages", "Learning another language takes time, regular practice, and patience. Short daily sessions can help learners remember vocabulary. Reading, listening, and speaking together give learners different ways to build confidence.", "B1"),
    ("Protecting Urban Wildlife", "Cities can support wildlife by planting native trees, protecting green spaces, and reducing unnecessary light at night. Small changes help birds and insects find food and shelter, even in busy neighborhoods.", "B1"),
    ("The Value of Reliable Information", "When people make important decisions, they should compare evidence and check the source of a claim. Reliable information explains where its facts come from and separates measured results from personal opinion.", "C1"),
]


def seed_articles(apps, schema_editor):
    Article = apps.get_model("reading", "Article")
    for title, content, level in ARTICLES:
        Article.objects.get_or_create(title=title, defaults={"content": content, "level": level})


class Migration(migrations.Migration):
    dependencies = [("reading", "0002_articleprogress")]
    operations = [migrations.RunPython(seed_articles, migrations.RunPython.noop)]

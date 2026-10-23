from django.db import migrations


ARTICLES = [
    (
        "A Helpful Neighbor",
        "Mina moved into a new apartment on Monday. She did not know anyone in the building, so she felt a little nervous. On Tuesday, her neighbor Sam knocked on the door and offered her a spare chair. They talked for ten minutes and discovered that they both enjoy gardening. On Saturday, Mina helped Sam plant flowers outside the building. Now they say hello every morning, and Mina feels more at home.",
        "A1",
    ),
    (
        "A Day Without a Car",
        "Daniel usually drives to work, but his car needed repairs last week. He took the bus instead. At first, he worried that the journey would take too long. He checked the timetable, left home early, and found a seat near the window. The bus was slower in traffic, but Daniel listened to a podcast and did not need to find a parking space. He decided to walk to the bus stop twice a week.",
        "A1",
    ),
    (
        "Cooking Together",
        "Every Friday, Sara cooks dinner with her brother. They choose a simple recipe and make a shopping list before going to the market. Sara washes the vegetables while her brother cuts them. Sometimes they make mistakes, but they laugh and try again. Their favorite meal is vegetable soup with fresh bread. After dinner, they clean the kitchen together. Cooking helps them save money, learn new skills, and spend time with each other.",
        "A1",
    ),
    (
        "Building a Study Habit",
        "When Leo began learning English, he studied for two hours on Sunday and then did nothing for the rest of the week. He often forgot new words. His teacher suggested a smaller routine: fifteen minutes each day, with a short review at the end. Leo began keeping a notebook and using new vocabulary in his own sentences. After a month, studying felt easier because it had become part of his normal day. He learned that consistency can matter more than occasional long sessions.",
        "B1",
    ),
    (
        "Choosing a Healthy Routine",
        "A healthy routine does not need to involve dramatic changes. People can begin by taking a short walk, drinking water regularly, and keeping a steady sleep schedule. The most useful habit is often the one a person can repeat without too much effort. It also helps to connect a new activity to an existing one, such as stretching after breakfast. Progress may be slow, so it is important to notice small improvements instead of giving up after a difficult day.",
        "B1",
    ),
    (
        "A Community Repair Cafe",
        "In one town, volunteers run a monthly repair cafe in the public library. Residents bring broken lamps, torn clothes, and small household items instead of throwing them away. Skilled volunteers show visitors how to diagnose simple problems and use basic tools safely. The event saves money and reduces waste, but it also creates opportunities for people to share knowledge. Organizers say the main goal is not to repair every object; it is to help the community become more confident about repairing and reusing things.",
        "B1",
    ),
    (
        "When Convenience Has a Cost",
        "Digital services promise to save time by making shopping, communication, and entertainment almost effortless. Yet convenience can hide costs that are distributed unevenly. A one-click purchase may encourage unnecessary consumption, while constant notifications can fragment attention. These effects do not mean that technology is inherently harmful; rather, they suggest that design choices influence behavior. Users can benefit from setting boundaries, and companies can make those boundaries easier to maintain. Genuine convenience should reduce friction without quietly undermining attention, autonomy, or long-term well-being.",
        "C1",
    ),
    (
        "Understanding Confirmation Bias",
        "Confirmation bias is the tendency to favor information that supports an existing belief while discounting evidence that challenges it. It can affect experts as well as beginners because confidence does not eliminate selective attention. One practical response is to state what evidence would change your mind before evaluating a claim. Comparing independent sources and actively searching for credible counterarguments can also reveal weaknesses in an initial conclusion. The aim is not to treat every opinion as equally valid, but to make the process of reaching a judgment more deliberate and transparent.",
        "C1",
    ),
    (
        "The Case for Urban Trees",
        "Urban trees provide more than visual appeal. Their shade can reduce surface temperatures, while leaves and soil help manage rainwater and create habitats for birds and insects. However, the benefits depend on species selection, maintenance, and where trees are planted. A poorly planned program may place trees where roots damage infrastructure or where residents have little access to green space. Effective urban forestry therefore requires long-term funding and community input, with priority given to neighborhoods that experience the greatest heat and have the fewest cooling resources.",
        "C1",
    ),
]


def seed_articles(apps, schema_editor):
    Article = apps.get_model("reading", "Article")
    for title, content, level in ARTICLES:
        Article.objects.get_or_create(
            title=title,
            defaults={"content": content, "level": level},
        )


class Migration(migrations.Migration):
    dependencies = [("reading", "0003_seed_articles")]
    operations = [migrations.RunPython(seed_articles, migrations.RunPython.noop)]

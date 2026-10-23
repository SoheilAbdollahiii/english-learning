"""Add original reading passages across CEFR-inspired levels.

Passages are newly authored for this project. Level labels are editorial estimates
informed by CEFR descriptors, not official certification. Source:
https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors
"""
from django.db import migrations


ARTICLES = [
    [
        "A First Visit to the Doctor",
        "On Thursday morning, Amir woke up with a sore throat and a headache. He called the clinic and made an appointment for the afternoon. The nurse asked him a few questions, and the doctor checked his temperature. The doctor advised him to rest, drink enough water, and return if he felt worse. Amir followed the advice and cancelled his football plans. By Sunday, he felt better. He learned that asking for help early can prevent a small problem from becoming more serious.",
        "A1"
    ],
    [
        "Finding the Right Bus",
        "Lily was visiting a new city and wanted to see the art museum. At the station, she checked the map and asked a driver which bus to take. He explained that she needed the number six and should get off after the large bridge. Lily paid for her ticket and watched the stops carefully. She arrived ten minutes later than expected, but the museum was easy to find. She saved the route on her phone for the journey back.",
        "A1"
    ],
    [
        "A Small Birthday Surprise",
        "Omid wanted to surprise his sister on her birthday. He invited two close friends and bought a chocolate cake from the bakery near their home. While his sister was out, everyone decorated the living room with paper flowers and balloons. When she opened the door, they shouted, “Happy birthday!” She was surprised and laughed. They ate cake, played music, and shared stories. The party was simple, but she said it was one of her favorite birthdays because everyone had helped.",
        "A1"
    ],
    [
        "Learning from Feedback",
        "When Farah submitted her first English presentation, she expected her teacher to correct every mistake. Instead, the teacher highlighted two strengths and suggested three specific improvements. Farah rewrote the introduction, practised difficult words aloud, and added clearer examples. Her second presentation was not perfect, but the audience understood her main points more easily. She began to see feedback as information she could act on rather than a judgment of her ability. That change made it easier to keep practising after disappointing results.",
        "B1"
    ],
    [
        "A More Useful Team Meeting",
        "A small design team noticed that its weekly meetings often lasted an hour without producing clear decisions. The manager asked everyone to send updates in advance and added an agenda with one owner for each topic. During the meeting, the group discussed only unresolved questions and recorded decisions beside each task. The next meeting lasted twenty-five minutes. The team still had disagreements, but the new process made responsibilities visible and reduced the need to repeat the same conversation.",
        "B1"
    ],
    [
        "Repair Before Replacing",
        "A local electronics shop began offering inexpensive repairs for phones and laptops. At first, some customers doubted that older devices were worth fixing. The technicians explained the likely cost, the expected lifespan after repair, and whether replacement parts were available. Customers could then compare the options before deciding. The service reduced unnecessary waste and helped people keep familiar devices for longer. It also taught customers that a low purchase price is not the only factor to consider when judging the total cost of owning a product.",
        "B1"
    ],
    [
        "Why Cities Need Quiet Spaces",
        "Urban planning often focuses on transport, housing, and commercial activity, while quiet public spaces receive less attention. Yet parks, libraries, and pedestrian courtyards can provide relief from noise and give residents places to think, read, or meet informally. Their value is not distributed evenly: people in crowded neighborhoods may have fewer such spaces within walking distance. Planners can address this imbalance by measuring access as well as total green area. A city becomes more livable when calm spaces are treated as essential infrastructure rather than decorative extras.",
        "C1"
    ],
    [
        "Interpreting Data Responsibly",
        "A chart can make a pattern visible, but it cannot explain that pattern on its own. Before drawing conclusions, readers should ask who was measured, how the data were collected, and whether important variables were excluded. A rise in two outcomes at the same time does not necessarily mean that one caused the other. Uncertainty should be reported rather than hidden, especially when a decision affects public resources. Responsible interpretation combines numerical evidence with knowledge of how the data were produced and what they cannot establish.",
        "C1"
    ],
    [
        "Designing Better Online Learning",
        "Online learning platforms can expand access, but access alone does not guarantee meaningful learning. Learners need clear goals, timely feedback, opportunities to retrieve information from memory, and tasks that gradually increase in difficulty. A large library of videos may look impressive while leaving learners unsure what to do next. Effective platforms make progress visible and help users choose a manageable next step. They also provide alternatives for different schedules and accessibility needs. Product quality should therefore be assessed through learning outcomes and sustained engagement, not simply through the volume of content available.",
        "C1"
    ]
]


def seed_articles(apps, schema_editor):
    Article = apps.get_model("reading", "Article")
    for title, content, level in ARTICLES:
        Article.objects.get_or_create(
            title=title,
            defaults={"content": content, "level": level},
        )


class Migration(migrations.Migration):
    dependencies = [("reading", "0004_expand_reading_library")]
    operations = [migrations.RunPython(seed_articles, migrations.RunPython.noop)]

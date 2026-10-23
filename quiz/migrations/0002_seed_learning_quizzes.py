from django.db import migrations


QUESTIONS = [
    ("vocabulary", "Which word is closest in meaning to 'rapid'?", "Careful", "Quick", "Quiet", "Late", "B", "Rapid means fast or quick.", "A1"),
    ("vocabulary", "She ___ to work by bus every day.", "go", "going", "goes", "gone", "C", "With she/he/it in the present simple, use the verb form ending in -s or -es.", "A1"),
    ("vocabulary", "What does 'reluctant' mean?", "Unwilling", "Excited", "Certain", "Careless", "A", "Reluctant means hesitant or unwilling to do something.", "B1"),
    ("vocabulary", "What is the plural form of 'child'?", "Childs", "Childes", "Children", "Childrens", "C", "The irregular plural of child is children.", "A1"),
    ("vocabulary", "What is the past simple form of 'buy'?", "Bought", "Buyed", "Buying", "Buys", "A", "Buy is irregular; its past simple form is bought.", "A1"),
    ("reading", "Read: 'Maya takes the bus to the library every Saturday. She borrows two books and returns them the following week.' Where does Maya go?", "A museum", "A library", "A hospital", "A station", "B", "The passage says Maya takes the bus to the library.", "A1"),
    ("reading", "Read: 'Maya takes the bus to the library every Saturday. She borrows two books and returns them the following week.' When does Maya visit?", "Every Saturday", "Every Monday", "Once a year", "Every evening", "A", "The passage says she goes every Saturday.", "A1"),
    ("reading", "Read: 'Maya takes the bus to the library every Saturday. She borrows two books and returns them the following week.' How many books does she borrow?", "One", "Three", "Two", "Four", "C", "The passage explicitly says she borrows two books.", "A1"),
    ("reading", "Read: 'The city planted trees along the road. In summer, the trees provide shade for people walking to work.' Why are the trees helpful?", "They make roads wider", "They provide shade", "They stop all traffic", "They replace buses", "B", "The passage says the trees provide shade in summer.", "A1"),
    ("reading", "Read: 'Leo checked the weather forecast and saw that heavy rain was expected. He packed an umbrella before leaving home.' Why did Leo pack an umbrella?", "He expected rain", "He planned to swim", "He lost his coat", "He wanted more sunlight", "A", "The forecast predicted heavy rain, so the umbrella was practical.", "A1"),
    ("grammar", "They ___ playing football now.", "is", "are", "was", "be", "B", "The subject 'they' takes 'are' in the present continuous.", "A1"),
    ("grammar", "I have lived here ___ 2020.", "for", "during", "since", "from", "C", "Use since with the starting point of a period of time.", "B1"),
    ("grammar", "If it rains tomorrow, we ___ at home.", "stayed", "stay yesterday", "will stay", "would stayed", "C", "The first conditional uses present simple in the if-clause and will + base verb in the result clause.", "B1"),
    ("grammar", "He doesn't ___ coffee.", "likes", "liked", "liking", "like", "D", "After doesn't, use the base form of the verb: like.", "A1"),
    ("grammar", "There ___ several reasons to learn another language.", "are", "is", "was", "be", "A", "The plural subject 'several reasons' takes 'are'.", "B1"),
]


def seed_questions(apps, schema_editor):
    Question = apps.get_model("quiz", "Question")
    Question.objects.filter(question_text="Choose the correct synonym for 'Happy':").delete()
    for quiz_type, text, a, b, c, d, correct, explanation, level in QUESTIONS:
        Question.objects.get_or_create(
            quiz_type=quiz_type,
            question_text=text,
            defaults={
                "option_a": a,
                "option_b": b,
                "option_c": c,
                "option_d": d,
                "correct_option": correct,
                "explanation": explanation,
                "level": level,
            },
        )


class Migration(migrations.Migration):
    dependencies = [("quiz", "0001_initial")]
    operations = [migrations.RunPython(seed_questions, migrations.RunPython.noop)]

"""Seed additional original quiz questions for each supported skill and level.

Questions and explanations are original editorial content. Level labels are
CEFR-informed estimates, not official exam items. See:
https://www.coe.int/en/web/common-european-framework-reference-languages/cefr-descriptors
"""
from django.db import migrations


QUESTIONS = [
    [
        "vocabulary",
        "Which word means 'to get something that you have paid for'?",
        "receive",
        "borrow",
        "purchase",
        "lend",
        "C",
        "Purchase means to buy something.",
        "A1"
    ],
    [
        "vocabulary",
        "Choose the best word: The train leaves at 8:15, so please arrive ___.",
        "late",
        "early",
        "expensive",
        "quiet",
        "B",
        "Arriving early means getting there before the expected time.",
        "A1"
    ],
    [
        "vocabulary",
        "Which word means a person who comes to stay with you?",
        "neighbour",
        "driver",
        "guest",
        "customer",
        "C",
        "A guest is someone invited to visit or stay.",
        "A1"
    ],
    [
        "reading",
        "Read: 'Nora puts her keys beside the door every evening. When she leaves in the morning, she checks that she has her keys, phone, and bag.' Why does Nora keep her keys near the door?",
        "To remember to take them",
        "To give them to a guest",
        "To clean them every day",
        "To hide them from her family",
        "A",
        "The habit helps her remember her keys before leaving.",
        "A1"
    ],
    [
        "reading",
        "Read: 'Ben wanted soup for lunch. He bought carrots, potatoes, and bread at the market. At home, he washed the vegetables and cooked them in a pot.' Where did Ben buy the food?",
        "At a library",
        "At a hospital",
        "At a market",
        "At a cinema",
        "C",
        "The passage says he bought the ingredients at the market.",
        "A1"
    ],
    [
        "reading",
        "Read: 'It was raining, so Mia took an umbrella. She walked to the bus stop and waited under its roof.' Why did Mia take an umbrella?",
        "It was very hot",
        "It was raining",
        "She wanted to buy one",
        "The bus was broken",
        "B",
        "The first sentence directly states that it was raining.",
        "A1"
    ],
    [
        "grammar",
        "My brother ___ coffee every morning.",
        "drink",
        "drinks",
        "drinking",
        "drank",
        "B",
        "Use drinks with the third-person singular subject my brother in the present simple.",
        "A1"
    ],
    [
        "grammar",
        "There ___ two books on the table.",
        "is",
        "be",
        "are",
        "was",
        "C",
        "Use are with the plural noun two books.",
        "A1"
    ],
    [
        "grammar",
        "We went to the park ___ Sunday.",
        "in",
        "on",
        "at",
        "by",
        "B",
        "Use on with days of the week.",
        "A1"
    ],
    [
        "vocabulary",
        "If a plan is practical and possible to do, it is ___.",
        "feasible",
        "arbitrary",
        "reluctant",
        "abstract",
        "A",
        "Feasible means possible and practical to achieve.",
        "C1"
    ],
    [
        "vocabulary",
        "Which verb means to assign resources for a particular purpose?",
        "fluctuate",
        "allocate",
        "contradict",
        "cease",
        "B",
        "Allocate means to distribute or assign resources for a specific purpose.",
        "C1"
    ],
    [
        "vocabulary",
        "An argument that is clear and supported by evidence is best described as ___.",
        "vague",
        "incidental",
        "well-substantiated",
        "temporary",
        "C",
        "Well-substantiated means supported by evidence or strong reasons.",
        "C1"
    ],
    [
        "reading",
        "Read: 'The pilot program reduced energy use in three buildings. However, all three buildings had recently installed new insulation, so the report could not attribute the entire reduction to the pilot alone.' What is the key limitation?",
        "The buildings used no energy",
        "The pilot was never measured",
        "Another change may also explain the reduction",
        "The report recommends more insulation be removed",
        "C",
        "The insulation upgrade is a potential confounding factor.",
        "C1"
    ],
    [
        "reading",
        "Read: 'The author distinguishes between what the survey directly measured and what the team inferred from it. The distinction allows readers to assess which claims are supported by data and which remain hypotheses.' Why is the distinction useful?",
        "It makes every hypothesis a proven fact",
        "It helps readers evaluate the strength of each claim",
        "It prevents future research",
        "It removes the need to describe methods",
        "B",
        "Separating measurements from inferences clarifies the evidential status of claims.",
        "C1"
    ],
    [
        "reading",
        "Read: 'A policy may produce immediate savings while creating maintenance costs years later. The evaluation therefore compares costs and benefits over the asset's expected lifetime.' Which principle guides the evaluation?",
        "Consider only the first payment",
        "Ignore uncertain future costs",
        "Assess long-term effects as well as immediate effects",
        "Assume maintenance is always free",
        "C",
        "The evaluation takes a whole-lifetime perspective rather than a short-term one.",
        "C1"
    ],
    [
        "grammar",
        "Not until the final results were published ___ the scale of the problem.",
        "we understood",
        "did we understand",
        "we did understood",
        "understood we",
        "B",
        "A fronted negative phrase triggers subject–auxiliary inversion: did we understand.",
        "C1"
    ],
    [
        "grammar",
        "The committee recommended that the proposal ___ revised before approval.",
        "is",
        "was",
        "be",
        "will be",
        "C",
        "Formal mandative subjunctive uses the base form be after recommended that.",
        "C1"
    ],
    [
        "grammar",
        "Had the evidence been disclosed earlier, the public ___ better informed.",
        "would have been",
        "will be",
        "would be being",
        "had been",
        "A",
        "This is an inverted third conditional: Had + subject + past participle, would have + past participle.",
        "C1"
    ],
    [
        "vocabulary",
        "The hotel was ___ located, only two minutes from the station.",
        "conveniently",
        "convenience",
        "convenient",
        "convenientness",
        "A",
        "Conveniently is the adverb modifying located.",
        "B1"
    ],
    [
        "vocabulary",
        "Which verb means to officially say that something will happen?",
        "announce",
        "avoid",
        "belong",
        "complain",
        "A",
        "Announce means to make information publicly or formally known.",
        "B1"
    ],
    [
        "vocabulary",
        "A person who feels sure about their ability is ___.",
        "foreign",
        "confident",
        "recent",
        "common",
        "B",
        "Confident means feeling sure about yourself or your abilities.",
        "B1"
    ],
    [
        "reading",
        "Read: 'The library extended its opening hours during exam month. More students used the quiet study rooms, but staff also had to arrange additional evening shifts.' What was one challenge?",
        "Fewer students visited",
        "The library closed permanently",
        "Staff needed extra evening shifts",
        "The study rooms were removed",
        "C",
        "Longer opening hours required extra staffing.",
        "B1"
    ],
    [
        "reading",
        "Read: 'Ravi started cycling to work twice a week. He saves money on transport and feels more energetic, although he checks the weather before leaving.' Which benefit does Ravi mention?",
        "He never needs to check the weather",
        "He saves money on transport",
        "His working hours are shorter",
        "His office moved closer",
        "B",
        "The passage explicitly mentions saving money on transport.",
        "B1"
    ],
    [
        "reading",
        "Read: 'The school introduced a book exchange. Students bring books they have finished and choose another one, so the same books can be read by several people.' What is the main purpose?",
        "To sell new books",
        "To stop students reading",
        "To let students share books",
        "To replace all lessons",
        "C",
        "The exchange allows books to be reused by multiple students.",
        "B1"
    ],
    [
        "grammar",
        "If she ___ the earlier train, she would be here now.",
        "takes",
        "took",
        "will take",
        "has taken",
        "B",
        "The second conditional uses the past simple in the if-clause: If she took...",
        "B1"
    ],
    [
        "grammar",
        "I have lived in this town ___ 2020.",
        "for",
        "during",
        "since",
        "from",
        "C",
        "Use since with a starting point in time.",
        "B1"
    ],
    [
        "grammar",
        "The report was delayed ___ the team needed more reliable data.",
        "because",
        "although",
        "unless",
        "despite",
        "A",
        "Because introduces the reason for the delay.",
        "B1"
    ]
]


def seed_questions(apps, schema_editor):
    Question = apps.get_model("quiz", "Question")
    letters = ("A", "B", "C", "D")
    for index, (quiz_type, text, a, b, c, d, correct, explanation, level) in enumerate(QUESTIONS):
        options = [a, b, c, d]
        shift = index % len(options)
        options = options[shift:] + options[:shift]
        correct_index = (letters.index(correct) - shift) % len(letters)
        Question.objects.get_or_create(
            quiz_type=quiz_type,
            question_text=text,
            defaults={
                "option_a": options[0], "option_b": options[1],
                "option_c": options[2], "option_d": options[3],
                "correct_option": letters[correct_index],
                "explanation": explanation, "level": level,
            },
        )


class Migration(migrations.Migration):
    dependencies = [("quiz", "0004_add_quiz_session_level")]
    operations = [migrations.RunPython(seed_questions, migrations.RunPython.noop)]

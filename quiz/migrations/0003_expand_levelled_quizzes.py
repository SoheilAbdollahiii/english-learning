from django.db import migrations


QUESTIONS = [
    # Vocabulary: A1 (one), B1 (four), C1 (five)
    ("vocabulary", "Choose the best word: Please ___ the door when you leave.", "close", "carry", "invite", "listen", "A", "Close means to shut the door.", "A1"),
    ("vocabulary", "Which word means to make something better?", "prevent", "improve", "borrow", "happen", "B", "Improve means to make or become better.", "B1"),
    ("vocabulary", "Which verb means to think carefully about an option?", "invite", "follow", "consider", "spend", "C", "Consider means to think about something carefully before deciding.", "B1"),
    ("vocabulary", "Which adjective describes someone who can be trusted?", "reluctant", "reliable", "ambiguous", "inevitable", "B", "Reliable describes a person or thing that can be depended on.", "B1"),
    ("vocabulary", "Choose the best word: Before choosing a supplier, we should ___ the prices and service levels.", "compare", "happen", "carry", "listen", "A", "Compare means to examine two or more things to notice similarities and differences.", "B1"),
    ("vocabulary", "Which adjective means brief but complete?", "apparent", "conventional", "concise", "adequate", "C", "Concise means expressing information clearly in few words.", "C1"),
    ("vocabulary", "Which verb means to reduce the severity or impact of a problem?", "imply", "acquire", "mitigate", "perceive", "C", "Mitigate means to make something harmful or serious less severe.", "C1"),
    ("vocabulary", "Which adjective means based on facts rather than personal feelings?", "ambiguous", "objective", "convenient", "reluctant", "B", "Objective means not influenced by personal feelings or opinions.", "C1"),
    ("vocabulary", "Which word describes an argument that is powerful and convincing?", "adequate", "apparent", "compelling", "conventional", "C", "A compelling argument is convincing and persuasive.", "C1"),
    ("vocabulary", "Which word means open to more than one interpretation?", "accurate", "concise", "sustainable", "ambiguous", "D", "Ambiguous means having more than one possible meaning or interpretation.", "C1"),

    # Reading: five B1 and five C1 questions; the existing bank covers A1.
    ("reading", "Read: 'The town added a protected bike lane after residents reported that the main road felt unsafe. Six months later, more people cycled to the station, although traffic on nearby streets still needed attention.' What was one result of the new lane?", "The station was moved", "More people cycled to the station", "All traffic disappeared", "Residents stopped travelling", "B", "The passage states that more people cycled to the station after the lane was added.", "B1"),
    ("reading", "Read: 'Nadia studies vocabulary in short sessions. She reviews older words before adding new ones and writes an example sentence for each difficult word.' Why does Nadia review older words?", "To avoid writing sentences", "To strengthen her memory", "To finish the course in one day", "To replace reading practice", "B", "Reviewing previously learned words helps reinforce memory.", "B1"),
    ("reading", "Read: 'A community garden began with six families sharing a vacant lot. They agreed on a watering schedule and donated some vegetables to a local food bank.' What helped the garden operate?", "A private parking area", "A shared schedule", "A new shopping centre", "A ban on vegetables", "B", "The families agreed on a watering schedule and shared responsibilities.", "B1"),
    ("reading", "Read: 'The company allowed employees to work from home two days a week. Meetings became shorter, but managers introduced written project updates so everyone could follow decisions.' Why were written updates introduced?", "To increase meeting length", "To stop employees working remotely", "To keep everyone informed", "To remove project goals", "C", "Written updates helped employees follow decisions when not everyone was in the same place.", "B1"),
    ("reading", "Read: 'A town repaired old buildings instead of replacing them. The project preserved local character, though builders had to work carefully around outdated wiring and plumbing.' What challenge did builders face?", "Finding any buildings to repair", "Removing all local history", "Working around old systems", "Closing every business permanently", "C", "The passage specifically mentions outdated wiring and plumbing.", "B1"),
    ("reading", "Read: 'A study found that people who used a planning app completed more tasks. However, participants had chosen whether to use the app, so the researchers could not rule out the possibility that more organized people were already more likely to adopt it.' What limitation does the passage identify?", "The app prevented people from completing tasks", "The study cannot establish that the app caused the improvement", "No participants used the app", "The researchers measured only weather", "B", "Because participants chose whether to use the app, other differences may explain the result; correlation alone does not prove causation.", "C1"),
    ("reading", "Read: 'The city planted trees in neighborhoods with the highest summer temperatures. The program's success was measured not only by the number of trees planted but also by survival rates, shade coverage, and residents' access to cooler public spaces.' Which measure best reflects the program's long-term value?", "The number of press releases published", "Whether trees survive and provide shade where people need it", "The size of the planting ceremony", "The number of temporary signs installed", "B", "Survival, shade, and access measure continuing benefits more directly than publicity or ceremony size.", "C1"),
    ("reading", "Read: 'When a platform recommends similar articles repeatedly, users may see fewer opposing views. This can make a narrow set of opinions appear more widely accepted than it really is.' What risk is described?", "Users are guaranteed to change their opinions", "All recommended articles are inaccurate", "Recommendations may limit exposure to different perspectives", "Platforms stop collecting any data", "C", "Repeatedly similar recommendations can narrow the range of viewpoints users encounter.", "C1"),
    ("reading", "Read: 'A policy reduced single-use packaging in public buildings, but some replacements required more energy to manufacture. Evaluating the policy therefore required comparing the full life cycle of each material rather than judging it by appearance alone.' What approach does the passage recommend?", "Assume every replacement is automatically better", "Measure only the colour of the material", "Compare impacts across the full life cycle", "Ignore manufacturing energy", "C", "A life-cycle comparison accounts for impacts beyond the item's appearance or immediate use.", "C1"),
    ("reading", "Read: 'The report separates measured outcomes from predictions and labels the assumptions behind each forecast. This makes its conclusions easier to challenge and update when new evidence becomes available.' Why is the report transparent?", "It avoids mentioning any evidence", "It distinguishes results, predictions, and assumptions", "It presents forecasts as certain facts", "It prevents readers from questioning conclusions", "B", "Clearly separating outcomes, forecasts, and assumptions allows readers to assess and revise the reasoning.", "C1"),

    # Grammar: three A1, two B1, and five C1 questions.
    ("grammar", "She ___ breakfast at seven every day.", "eat", "eats", "eating", "ate", "B", "With she in the present simple, use the third-person singular form eats.", "A1"),
    ("grammar", "Look! The children ___ in the garden.", "play", "played", "are playing", "plays", "C", "Use the present continuous for an action happening now: are playing.", "A1"),
    ("grammar", "We ___ to the museum yesterday.", "go", "gone", "going", "went", "D", "Yesterday signals the past simple; the past form of go is went.", "A1"),
    ("grammar", "If I ___ more time, I would take an evening course.", "have", "had", "will have", "am having", "B", "The second conditional uses past simple in the if-clause and would + base verb in the result clause.", "B1"),
    ("grammar", "By the time we arrived, the meeting ___.", "starts", "has started", "had started", "will start", "C", "Use the past perfect for an action completed before another past event.", "B1"),
    ("grammar", "Rarely ___ such a clear explanation of the issue.", "I have heard", "I heard have", "have I heard", "did I have heard", "C", "A negative or restrictive adverb at the beginning triggers subject–auxiliary inversion: Rarely have I heard.", "C1"),
    ("grammar", "Had the team checked the figures, it ___ the error before publication.", "would find", "will have found", "would have found", "had found", "C", "This inverted third conditional means 'If the team had checked, it would have found'.", "C1"),
    ("grammar", "The proposal, along with its supporting documents, ___ submitted yesterday.", "were", "have been", "was", "are", "C", "The subject is the singular noun proposal; the phrase along with its documents does not change subject–verb agreement.", "C1"),
    ("grammar", "No sooner ___ the announcement than the market reacted.", "the company made", "had the company made", "did the company had made", "has the company make", "B", "No sooner at the beginning is followed by inversion and past perfect: No sooner had the company made ... than ... .", "C1"),
    ("grammar", "Her argument was persuasive, ___ it relied on an assumption that had not been tested.", "because of", "unless", "therefore", "although", "D", "Although introduces a contrast between the persuasive argument and the untested assumption.", "C1"),
]


def seed_questions(apps, schema_editor):
    Question = apps.get_model("quiz", "Question")
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
    dependencies = [("quiz", "0002_seed_learning_quizzes")]
    operations = [migrations.RunPython(seed_questions, migrations.RunPython.noop)]

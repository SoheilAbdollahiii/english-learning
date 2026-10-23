"""Add original A2, B2, and C2 questions so every CEFR level can be selected."""

from django.db import migrations


QUESTIONS = [
    # A2 vocabulary
    ("vocabulary", "A2", "If we put off the meeting, we will...", "start it earlier", "postpone it", "cancel the room", "attend it", "B", "To put something off means to postpone it until later."),
    ("vocabulary", "A2", "A place with too many people is...", "quiet", "empty", "crowded", "private", "C", "Crowded describes a place full of people."),
    ("vocabulary", "A2", "If you borrow a book, you...", "take it and plan to return it", "give it away forever", "buy it for someone", "write inside it", "A", "Borrow means to receive something temporarily and return it."),
    ("vocabulary", "A2", "You usually make an appointment when you want to...", "lose your keys", "meet someone at an agreed time", "change your address", "buy groceries", "B", "An appointment is an arrangement to meet at a particular time."),
    ("vocabulary", "A2", "A receipt shows...", "the weather forecast", "your travel route", "what you paid for", "your exam result", "C", "A receipt is proof of a purchase or payment."),
    ("vocabulary", "A2", "To improve your English means to...", "make it better", "forget it quickly", "translate every word", "stop practising", "A", "Improve means to make or become better."),
    ("vocabulary", "A2", "Which word means 'not uncomfortable'?", "expensive", "careless", "narrow", "comfortable", "D", "Comfortable means relaxed and physically at ease."),
    ("vocabulary", "A2", "A local shop is usually one that is...", "in another country", "near where you live", "only online", "open at midnight", "B", "Local refers to the area near a place or person."),
    # A2 grammar
    ("grammar", "A2", "We ___ to the museum yesterday.", "go", "have gone", "went", "are going", "C", "Use the past simple for a completed action at a finished time."),
    ("grammar", "A2", "This bag is ___ than that one.", "more cheap", "cheaper", "cheapest", "the cheaper", "B", "Short adjectives usually take -er in comparative forms."),
    ("grammar", "A2", "You look tired. You ___ get some rest.", "should", "mustn't", "would", "did", "A", "Should is used to give advice."),
    ("grammar", "A2", "Look at those dark clouds! It ___ rain.", "has", "did", "was", "is going to", "D", "Be going to can express a prediction based on present evidence."),
    ("grammar", "A2", "There isn't ___ milk left in the fridge.", "many", "some", "any", "a few", "C", "Any is common in negative sentences with uncountable nouns."),
    ("grammar", "A2", "How ___ apples do we need?", "much", "many", "little", "any", "B", "Many is used with plural countable nouns."),
    ("grammar", "A2", "She has lived here ___ 2022.", "since", "for", "during", "from", "A", "Since introduces the starting point of a period."),
    ("grammar", "A2", "He drives very ___.", "careful", "carefulness", "more careful", "carefully", "D", "Use the adverb carefully to describe how he drives."),
    # A2 reading
    ("reading", "A2", "Mina takes the 8:15 bus every weekday. Today it arrived at 8:30, so she reached work late. Why was Mina late?", "She missed her alarm", "The bus arrived late", "She took a taxi", "Her office moved", "B", "The passage says the bus arrived fifteen minutes late."),
    ("reading", "A2", "A notice says: 'Library closes at 6 p.m. on Fridays.' When must visitors leave on Friday?", "Before 6 p.m.", "At 8 p.m.", "Only in the morning", "Whenever they like", "A", "The library closes at six in the evening."),
    ("reading", "A2", "Tom bought a jacket online, but it was too small. The shop offered a larger size at no extra cost. What did the shop offer?", "A full-time job", "A smaller jacket", "An exchange for a larger jacket", "A more expensive coat", "C", "The shop offered to replace it with a larger size for free."),
    ("reading", "A2", "The park is free to enter, but visitors must pay to rent a bicycle. What is free?", "Bicycle rental", "Food at the café", "Parking all day", "Entering the park", "D", "The notice clearly says park entry is free."),
    ("reading", "A2", "Sara usually cooks at home because restaurants are expensive. What is her main reason for cooking?", "She dislikes all food", "It costs less", "She has no kitchen", "Restaurants are closed", "B", "She cooks at home to save money."),
    ("reading", "A2", "The train leaves at 10:20. Passengers should arrive fifteen minutes early. What time should they arrive?", "10:35", "10:20", "10:05", "9:50", "C", "Fifteen minutes before 10:20 is 10:05."),
    ("reading", "A2", "A sign says 'Wet floor — please use the other entrance.' What should people do?", "Use another entrance", "Run across the floor", "Clean the whole building", "Wait until tomorrow", "A", "The sign asks visitors to use a different entrance."),
    ("reading", "A2", "Leo watered the plants before leaving for a week. He also asked his neighbour to check them twice. What can we infer?", "Leo sold his plants", "The neighbour is moving away", "Leo forgot the plants", "Leo wanted the plants cared for", "D", "Watering them and asking for checks shows he wanted them looked after."),
    # B2 vocabulary
    ("vocabulary", "B2", "If a person is reluctant to agree, they are...", "eager to begin", "unwilling or hesitant", "certain of success", "unable to understand", "B", "Reluctant means unwilling or hesitant."),
    ("vocabulary", "B2", "The team will assess the risks before investing. Assess means...", "ignore", "increase", "evaluate", "publish", "C", "To assess something is to evaluate its nature or quality."),
    ("vocabulary", "B2", "The outcome of the negotiations was unexpected. Outcome means...", "final result", "opening speech", "financial cost only", "written request", "A", "An outcome is the result of an action or process."),
    ("vocabulary", "B2", "A sustainable policy is one that can...", "change every hour", "work only once", "avoid all planning", "continue over time without exhausting resources", "D", "Sustainable describes something that can be maintained over time."),
    ("vocabulary", "B2", "Managers must allocate enough time to training. Allocate means...", "hide", "distribute or assign", "remove permanently", "measure inaccurately", "B", "Allocate means to assign resources for a particular purpose."),
    ("vocabulary", "B2", "During the hike, we encountered heavy rain. Encountered means...", "avoided completely", "predicted exactly", "came across", "caused deliberately", "C", "To encounter is to meet or experience something unexpectedly."),
    ("vocabulary", "B2", "Constant interruptions can undermine concentration. Undermine means...", "weaken gradually", "prove beyond doubt", "replace completely", "reward generously", "A", "Undermine means to weaken or damage something."),
    ("vocabulary", "B2", "Her argument was compelling, so the committee accepted it. Compelling means...", "irrelevant", "unclear", "ordinary", "convincing", "D", "A compelling argument is persuasive and convincing."),
    # B2 grammar
    ("grammar", "B2", "If I ___ about the roadworks, I would have left earlier.", "knew", "had known", "would know", "have known", "B", "The third conditional uses if + past perfect for an unreal past condition."),
    ("grammar", "B2", "Despite ___ exhausted, she completed the report.", "be", "was", "being", "been", "C", "Despite is followed by a noun or gerund, not a finite clause."),
    ("grammar", "B2", "The director said that the launch ___ the following month.", "would take place", "will took place", "takes place yesterday", "has take place", "A", "Reported speech commonly shifts will to would after a past reporting verb."),
    ("grammar", "B2", "Only after the meeting ___ the seriousness of the problem.", "we understood", "we had understand", "did we understood", "did we understand", "D", "After a fronted restrictive phrase with only, use subject-auxiliary inversion."),
    ("grammar", "B2", "The proposal, ___ last week, has already been revised.", "discussing", "discussed", "was discussed it", "having discuss", "B", "A past participle clause can reduce a passive relative clause."),
    ("grammar", "B2", "I wish I ___ so much time on that task yesterday.", "don't spend", "wouldn't spend", "hadn't spent", "haven't spent", "C", "Wish + past perfect expresses regret about a past event."),
    ("grammar", "B2", "The results were ___ significant that the study was repeated.", "so", "such", "too", "enough", "A", "Use so + adjective + that to show a result."),
    ("grammar", "B2", "She denied ___ the confidential file.", "to copy", "copy", "to have copy", "having copied", "D", "Deny is followed by a gerund; having copied emphasizes the prior action."),
    # B2 reading
    ("reading", "B2", "A company introduced a four-day week. Output remained stable, while reported stress fell. What is the strongest conclusion?", "Everyone worked fewer hours but produced nothing", "The change may have improved well-being without reducing output", "The company closed three offices", "Stress was never measured", "B", "The evidence suggests lower reported stress alongside stable output, though it does not prove causation."),
    ("reading", "B2", "The report calls the pilot promising but notes that only twelve volunteers took part. Why include this limitation?", "To show the pilot failed completely", "To prove the volunteers lied", "To caution against generalising from a small sample", "To recommend ending all research", "C", "A small volunteer sample limits how widely the findings can be applied."),
    ("reading", "B2", "Although the app attracted many downloads, few users returned after the first week. What does this imply?", "Initial interest did not translate into sustained use", "The app was never released", "Every user paid a subscription", "The download count was zero", "A", "Downloads were high, but retention was low."),
    ("reading", "B2", "The author supports remote work but argues that new staff need structured mentoring. What is the author's position?", "Remote work should be banned", "Mentoring is unnecessary", "Only new staff should work remotely", "Remote work has benefits but needs support for newcomers", "D", "The author is positive about remote work while identifying a specific support need."),
    ("reading", "B2", "A town planted trees along streets that had the highest summer temperatures. What was the likely goal?", "To increase traffic noise", "To reduce local heat and provide shade", "To remove all public spaces", "To make streets narrower for no reason", "B", "Trees provide shade and can help reduce urban heat."),
    ("reading", "B2", "The survey found that people who exercised more reported better sleep, but it did not track other habits. What remains uncertain?", "Whether exercise exists", "Whether anyone answered the survey", "Whether other factors also influenced sleep", "Whether sleep happens at night", "C", "Without controlling other habits, the relationship may have additional explanations."),
    ("reading", "B2", "The museum extended its hours after visitor feedback, and evening attendance rose. Which statement is supported?", "The extended hours coincided with higher evening attendance", "Every visitor preferred mornings", "The museum reduced its collection", "Feedback was ignored", "A", "The passage directly links the schedule change with increased evening attendance."),
    ("reading", "B2", "A reviewer praises the book's research but finds its structure difficult to follow. Which summary is most accurate?", "The reviewer rejects the research as false", "The book has no structure", "The reviewer found every part easy", "The reviewer sees strong research but a structural weakness", "D", "The review gives both a strength and a criticism."),
    # C2 vocabulary
    ("vocabulary", "C2", "An equivocal statement is one that is...", "perfectly explicit", "open to more than one interpretation", "entirely irrelevant", "grammatically impossible", "B", "Equivocal means ambiguous or open to multiple interpretations."),
    ("vocabulary", "C2", "The new measures may mitigate the damage. Mitigate means...", "intensify", "conceal", "lessen the severity of", "reproduce exactly", "C", "Mitigate means to make something less severe or harmful."),
    ("vocabulary", "C2", "The ostensibly neutral proposal favoured one group in practice. Ostensibly means...", "apparently or supposedly", "beyond any doubt", "for no reason", "in retrospect only", "A", "Ostensibly describes how something appears, possibly unlike its reality."),
    ("vocabulary", "C2", "Smartphones have become ubiquitous in many cities. Ubiquitous means...", "rarely repaired", "technically obsolete", "strictly regulated", "present or found everywhere", "D", "Ubiquitous means widespread or present almost everywhere."),
    ("vocabulary", "C2", "The evidence is too tenuous to support that claim. Tenuous means...", "conclusive", "weak or insubstantial", "widely replicated", "directly observable", "B", "Tenuous evidence is weak and does not strongly support a conclusion."),
    ("vocabulary", "C2", "The policy could exacerbate existing inequalities. Exacerbate means...", "resolve completely", "describe accurately", "make worse", "measure carefully", "C", "Exacerbate means to worsen a problem or condition."),
    ("vocabulary", "C2", "Independent records corroborate her account. Corroborate means...", "confirm or support with evidence", "contradict without evidence", "delay indefinitely", "simplify excessively", "A", "Corroborate means to confirm a statement with additional evidence."),
    ("vocabulary", "C2", "His reasoning was cogent and carefully evidenced. Cogent means...", "emotionally excessive", "deliberately obscure", "loosely connected", "clear, logical, and persuasive", "D", "Cogent describes reasoning that is clear and convincing."),
    # C2 grammar
    ("grammar", "C2", "Rarely ___ such a comprehensive account of the negotiations.", "we have seen", "have we seen", "we saw have", "did we have saw", "B", "Negative or restrictive adverbs at the start require subject-auxiliary inversion."),
    ("grammar", "C2", "The committee recommended that the report ___ before publication.", "is revised", "was revising", "be revised", "will revised", "C", "In formal English, recommend that can take the mandative subjunctive: be revised."),
    ("grammar", "C2", "What the witness failed to mention ___ the earlier correspondence.", "was", "were", "have been", "being", "A", "The subject is the singular noun clause What the witness failed to mention."),
    ("grammar", "C2", "Had the warning been heeded, the damage ___.", "will be avoided", "would avoid", "had avoided", "might have been avoided", "D", "This inverted third conditional describes a possible alternative past outcome."),
    ("grammar", "C2", "Not until the figures were audited ___ the discrepancy.", "they discovered", "did they discover", "they had discover", "had they discovering", "B", "Not until at the beginning triggers subject-auxiliary inversion in the main clause."),
    ("grammar", "C2", "She speaks as though she ___ the entire negotiation herself.", "conducts", "has conduct", "had conducted", "would conducting", "C", "As though + past perfect can express an unreal or counterfactual past."),
    ("grammar", "C2", "I would sooner you ___ the matter with anyone until we have agreed on a response.", "didn't discuss", "don't discuss", "not discussed", "won't discussing", "A", "Would sooner + subject is followed by a past form for a present or future preference."),
    ("grammar", "C2", "So compelling ___ the evidence that even the sceptics reconsidered their position.", "the evidence was", "was the evidence", "the evidence did", "had evidence", "B", "So + adjective at the beginning is followed by inversion: so compelling was the evidence."),
    # C2 reading
    ("reading", "C2", "The review describes the reform as symbolically potent but institutionally modest. What distinction is being made?", "It was illegal and ineffective", "It had no public meaning", "Its public significance exceeded its practical institutional effect", "It changed every institution immediately", "C", "The wording contrasts strong symbolic value with limited structural change."),
    ("reading", "C2", "The author concedes that the dataset is incomplete, yet argues that its patterns are robust across independent samples. What is the central claim?", "The findings are worthless because data are missing", "The samples are all identical", "No patterns were found", "The recurring patterns may remain credible despite incomplete coverage", "D", "Replication across independent samples can strengthen confidence while leaving limitations."),
    ("reading", "C2", "A policy was presented as temporary, but successive extensions made it effectively permanent. What does this suggest?", "Its practical duration diverged from its original framing", "It ended exactly as planned", "It was never implemented", "Its purpose was universally understood", "A", "Repeated extensions turned a supposedly temporary measure into a lasting one."),
    ("reading", "C2", "The historian distinguishes between what officials recorded and what residents later remembered. Why?", "Records are always fictional", "Official documentation and lived experience may capture different aspects of events", "Residents cannot remember anything", "The historian refuses to use evidence", "B", "The distinction recognises that formal records and personal memory offer different evidence."),
    ("reading", "C2", "The experiment produced a striking correlation, although the mechanism remains unverified. Which interpretation is most cautious?", "The mechanism is now proven", "The correlation must be accidental", "The association is notable, but its cause has not been established", "No relationship was observed", "C", "A correlation can be meaningful without establishing the causal mechanism."),
    ("reading", "C2", "The essay's apparent digression returns in the conclusion as a key analogy. What effect does this structure create?", "It makes the conclusion unrelated", "It removes all ambiguity", "It proves the essay was written randomly", "It gives an initially peripheral idea retrospective significance", "D", "The conclusion reframes the earlier digression as relevant to the main argument."),
    ("reading", "C2", "The committee adopted the proposal only after its assumptions were made explicit and its uncertainties quantified. What mattered most?", "Clarifying the proposal's premises and limits", "Removing all numerical evidence", "Avoiding discussion of uncertainty", "Accepting the proposal without scrutiny", "A", "The committee acted after the assumptions and uncertainties were clearly examined."),
    ("reading", "C2", "The author calls the consensus 'provisional' because new archival material could alter the interpretation. What does provisional convey?", "Final and irreversible", "Tentative and open to revision", "Entirely unsupported", "Deliberately misleading", "B", "Provisional means accepted for now but subject to change when new evidence appears."),
]


def add_questions(apps, schema_editor):
    Question = apps.get_model("quiz", "Question")
    for quiz_type, level, text, a, b, c, d, correct, explanation in QUESTIONS:
        Question.objects.get_or_create(
            quiz_type=quiz_type,
            level=level,
            question_text=text,
            defaults={
                "option_a": a,
                "option_b": b,
                "option_c": c,
                "option_d": d,
                "correct_option": correct,
                "explanation": explanation,
            },
        )


def remove_questions(apps, schema_editor):
    Question = apps.get_model("quiz", "Question")
    Question.objects.filter(level__in=["A2", "B2", "C2"], question_text__in=[item[2] for item in QUESTIONS]).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("quiz", "0005_expand_question_bank"),
    ]

    operations = [
        migrations.RunPython(add_questions, remove_questions),
    ]

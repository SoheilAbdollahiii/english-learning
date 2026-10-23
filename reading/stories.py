"""Curated branching English-reading stories and their comprehension checks.

The answer keys stay on the server; clients fetch story text separately from answer checks.
"""

STORIES = [
    {
        "id": "midnight-platform",
        "title": "The Mystery of Platform Nine",
        "genre": "mystery",
        "level": "B1",
        "estimated_minutes": 5,
        "description": "A missed train, a strange note, and a choice that changes the night.",
        "start_node": "arrival",
        "nodes": {
            "arrival": {
                "text": "At 9:17 p.m., Maya reached the station just as her train disappeared into the dark. On the empty bench, she found a small blue envelope with her name written on it. The station clock had stopped, but the envelope felt warm.",
                "question": {
                    "prompt": "What makes the envelope unusual?",
                    "options": ["It is addressed to Maya and feels warm.", "It contains a train ticket.", "It is locked to the bench.", "It has the station logo on it."],
                    "correct_option": 0,
                    "explanation": "The text says the envelope has Maya's name on it and feels warm."
                },
                "choices": [
                    {"label": "Open the envelope", "next_node": "letter"},
                    {"label": "Ask the station clerk about it", "next_node": "clerk"}
                ]
            },
            "letter": {
                "text": "Inside, Maya found a note: “Find the clockmaker before the last bell.” A tiny brass key was taped beneath the paper. She noticed a narrow door behind the old timetable, marked with a faded clock symbol.",
                "question": {
                    "prompt": "What clue points Maya toward the hidden door?",
                    "options": ["A map in her pocket", "A faded clock symbol", "A message from the train driver", "A light under the bench"],
                    "correct_option": 1,
                    "explanation": "The narrow door is marked with a faded clock symbol, matching the note's reference to a clockmaker."
                },
                "choices": [
                    {"label": "Use the brass key on the door", "next_node": "clockmaker"},
                    {"label": "Leave the key and follow the station bell", "next_node": "bell"}
                ]
            },
            "clerk": {
                "text": "The clerk looked at the envelope and suddenly stopped smiling. “Someone has been leaving these for years,” he whispered. He handed Maya a timetable with one train circled in red: 9:17 p.m. The destination was listed as “Old Town—one passenger.”",
                "question": {
                    "prompt": "Why does the clerk's reaction seem important?",
                    "options": ["He wants Maya to buy a ticket.", "He recognizes the mysterious envelope.", "He is angry about the late train.", "He has never seen a timetable."],
                    "correct_option": 1,
                    "explanation": "He changes expression and says similar envelopes have appeared for years, suggesting he knows something about the mystery."
                },
                "choices": [
                    {"label": "Follow the red-circled destination", "next_node": "old-town"},
                    {"label": "Ask the clerk to explain the envelopes", "next_node": "confession"}
                ]
            },
            "clockmaker": {
                "text": "The key turned. Behind the door, a clockmaker was repairing hundreds of tiny clocks. “You came on time,” she said. She showed Maya a clock that could return one lost moment—but only if Maya used it to help someone else.",
                "question": {
                    "prompt": "What condition does the clockmaker give Maya?",
                    "options": ["She must pay for the clock.", "She must repair every clock.", "She must use the lost moment to help someone else.", "She must return before midnight."],
                    "correct_option": 2,
                    "explanation": "The clockmaker says the clock can return a lost moment only if Maya uses it to help another person."
                },
                "choices": [
                    {"label": "Use the moment to warn a stranded traveler", "next_node": "ending-kindness"},
                    {"label": "Use it to catch her own train", "next_node": "ending-self"}
                ]
            },
            "bell": {
                "text": "Maya followed the bell to a small waiting room. A child sat there beside a broken toy train, worried because her father had not returned. The note suddenly made sense: perhaps the “last bell” was asking Maya to notice someone who needed help.",
                "question": {
                    "prompt": "What does Maya discover in the waiting room?",
                    "options": ["A station manager hiding a key", "A child waiting for her father", "A second envelope", "A train ready to leave"],
                    "correct_option": 1,
                    "explanation": "The passage describes a child waiting for her father beside a broken toy train."
                },
                "choices": [
                    {"label": "Stay and help the child", "next_node": "ending-kindness"},
                    {"label": "Return to the platform alone", "next_node": "ending-self"}
                ]
            },
            "old-town": {
                "text": "The clerk led Maya to a tiny platform that did not appear on any public map. A train waited there, its windows glowing gold. On the seat was a letter from Maya's grandmother, who had worked at the station long ago.",
                "question": {
                    "prompt": "Why is the train platform surprising?",
                    "options": ["It is missing from public maps.", "It is inside the ticket office.", "It has no railway tracks.", "It is full of passengers."],
                    "correct_option": 0,
                    "explanation": "The platform is described as one that does not appear on any public map."
                },
                "choices": [
                    {"label": "Board and read the letter", "next_node": "ending-letter"},
                    {"label": "Ask the clerk to take her home", "next_node": "ending-home"}
                ]
            },
            "confession": {
                "text": "The clerk admitted that he had been keeping the envelopes safe for Maya's family. He did not know what was inside, but he had promised her grandmother to give one to Maya when the station clock stopped.",
                "question": {
                    "prompt": "Why did the clerk keep the envelopes?",
                    "options": ["He planned to sell them.", "He had promised Maya's grandmother.", "The station manager ordered him to.", "He wanted to stop the trains."],
                    "correct_option": 1,
                    "explanation": "The clerk says he promised Maya's grandmother to pass an envelope to Maya at the right moment."
                },
                "choices": [
                    {"label": "Thank him and open the next clue", "next_node": "ending-letter"},
                    {"label": "Leave the mystery for another night", "next_node": "ending-home"}
                ]
            },
            "ending-kindness": {"text": "Maya used the precious moment to help the stranded traveler and reunite the child with her father. Her own train was long gone, but the station clock began ticking again. On the bench, a new note appeared: “The right time is the time you give.”", "ending": True},
            "ending-self": {"text": "Maya caught the last train home, but the station clock remained frozen. In her pocket, the brass key had turned to dust. She had solved part of the mystery, yet the note's real meaning would have to wait for another night.", "ending": True},
            "ending-letter": {"text": "The letter revealed that Maya's grandmother had created the secret platform to reunite people with memories they thought they had lost. Maya stepped onto the golden train, ready to discover a family story no timetable could explain.", "ending": True},
            "ending-home": {"text": "Maya left the station safely, but kept the blue envelope. The clock started ticking just before she reached the exit. She smiled: some mysteries were not meant to be solved in a hurry.", "ending": True}
        }
    },
    {
        "id": "forest-signal",
        "title": "The Signal in the Forest",
        "genre": "adventure",
        "level": "A1",
        "estimated_minutes": 4,
        "description": "Two friends find a strange light while walking a forest trail.",
        "start_node": "trail",
        "nodes": {
            "trail": {
                "text": "Leo and Nina walked through the forest after lunch. They heard a soft beep near a large tree. A small green light blinked under some leaves, and a paper map lay beside it.",
                "question": {"prompt": "What do Leo and Nina find?", "options": ["A red bicycle", "A green light and a map", "A sleeping dog", "A bag of food"], "correct_option": 1, "explanation": "They find a blinking green light and a paper map under the leaves."},
                "choices": [{"label": "Follow the map", "next_node": "river"}, {"label": "Look for the source of the beep", "next_node": "cabin"}]
            },
            "river": {
                "text": "The map led them to a narrow river. On the other side, a small box flashed green. The bridge was old, but a sign said that a safe path was marked with white stones.",
                "question": {"prompt": "How can they find the safe path?", "options": ["Follow the white stones", "Walk into the river", "Climb the tallest tree", "Wait until dark"], "correct_option": 0, "explanation": "The sign says the safe path is marked with white stones."},
                "choices": [{"label": "Follow the stones together", "next_node": "ending-rescue"}, {"label": "Cross the old bridge quickly", "next_node": "ending-detour"}]
            },
            "cabin": {
                "text": "Behind the tree, they found a tiny radio inside a waterproof case. A voice said, “If you can hear this, please send help. I am near the north cabin.” The map showed a trail to the cabin.",
                "question": {"prompt": "What does the radio message ask for?", "options": ["A new map", "Food for a picnic", "Help for someone near the north cabin", "A ride to the city"], "correct_option": 2, "explanation": "The voice asks for help and says the speaker is near the north cabin."},
                "choices": [{"label": "Go carefully toward the cabin", "next_node": "ending-rescue"}, {"label": "Return to the park entrance to get help", "next_node": "ending-team"}]
            },
            "ending-rescue": {"text": "Leo and Nina reached the cabin and found a hiker with a hurt ankle. They called the rescue team using the radio. The hiker thanked them for staying calm and working together.", "ending": True},
            "ending-detour": {"text": "The bridge was too weak, so Leo and Nina turned back and followed the white stones instead. They lost a little time but reached the cabin safely and called for help.", "ending": True},
            "ending-team": {"text": "The friends returned to the park entrance and told a ranger about the radio. The ranger knew the north trail well and led a rescue team to the cabin. Everyone was safe by sunset.", "ending": True}
        }
    },
    {
        "id": "coffee-mixup",
        "title": "The Coffee Shop Mix-up",
        "genre": "everyday",
        "level": "B1",
        "estimated_minutes": 4,
        "description": "A simple mistake at a busy café becomes an unexpected friendship.",
        "start_node": "cafe",
        "nodes": {
            "cafe": {
                "text": "On Monday morning, Amir picked up a coffee at a busy café. The cup had his name on it, but the drink was full of milk. He had ordered black coffee because he was meeting a friend who could not drink milk.",
                "question": {"prompt": "Why is the drink a problem?", "options": ["It is too cold.", "It contains milk, unlike the order.", "It belongs to the café owner.", "It has no name on it."], "correct_option": 1, "explanation": "Amir ordered black coffee, but the drink contains milk."},
                "choices": [{"label": "Politely explain the mistake", "next_node": "barista"}, {"label": "Check the receipt first", "next_node": "receipt"}]
            },
            "barista": {
                "text": "Amir showed the cup to the barista and explained the allergy concern. She apologized and made a fresh drink. While waiting, he noticed another customer looking worried at a phone with a cracked screen.",
                "question": {"prompt": "What does the barista do after Amir explains?", "options": ["She ignores him.", "She asks him to leave.", "She apologizes and makes a fresh drink.", "She gives him a dessert."], "correct_option": 2, "explanation": "The barista apologizes and prepares a replacement coffee."},
                "choices": [{"label": "Offer the worried customer help", "next_node": "ending-friend"}, {"label": "Take the new coffee and leave", "next_node": "ending-rush"}]
            },
            "receipt": {
                "text": "The receipt clearly said “black coffee.” Amir returned to the counter and showed it to the barista. She thanked him for checking calmly and corrected the order. The worried customer nearby asked if Amir knew how to find a repair shop.",
                "question": {"prompt": "What does the receipt confirm?", "options": ["Amir ordered tea.", "The café is closed.", "Amir ordered black coffee.", "The drink was free."], "correct_option": 2, "explanation": "The receipt says “black coffee,” confirming Amir's original order."},
                "choices": [{"label": "Help the customer find a repair shop", "next_node": "ending-friend"}, {"label": "Leave to meet his friend", "next_node": "ending-rush"}]
            },
            "ending-friend": {"text": "Amir helped the customer find a nearby repair shop. They discovered they both worked in the same neighborhood and exchanged recommendations for lunch spots. A small café mistake had started a useful new friendship.", "ending": True},
            "ending-rush": {"text": "Amir arrived just in time to meet his friend. The coffee mix-up was solved, and he learned that a calm, clear explanation can fix a small problem without making the morning worse.", "ending": True}
        }
    }
]


def public_stories():
    """Return story nodes without exposing quiz answer keys."""
    result = []
    for story in STORIES:
        nodes = {}
        for node_id, node in story["nodes"].items():
            public_node = {key: value for key, value in node.items() if key != "question"}
            if "question" in node:
                question = node["question"]
                public_node["question"] = {
                    "prompt": question["prompt"],
                    "options": question["options"],
                }
            nodes[node_id] = public_node
        result.append({
            "id": story["id"],
            "title": story["title"],
            "genre": story["genre"],
            "level": story["level"],
            "estimated_minutes": story["estimated_minutes"],
            "description": story["description"],
            "start_node": story["start_node"],
            "nodes": nodes,
        })
    return result


def check_story_answer(story_id, node_id, option_index):
    """Validate a comprehension answer against server-side story data."""
    story = next((item for item in STORIES if item["id"] == story_id), None)
    if story is None:
        return None
    node = story["nodes"].get(node_id)
    if node is None or "question" not in node:
        return None
    question = node["question"]
    if not isinstance(option_index, int) or isinstance(option_index, bool) or not 0 <= option_index < len(question["options"]):
        return {"valid": False, "correct": False, "explanation": "Choose one of the available answers."}
    return {
        "valid": True,
        "correct": option_index == question["correct_option"],
        "explanation": question["explanation"],
    }

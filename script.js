const questions = [
    {
        type: "quiz",
        prompt: "What comforting drink do many Cape Muslim families prepare to break fast during Ramadan?",
        description: "It is often sweetened with condensed milk and spiced with cardamom and cinnamon.",
        options: [
            "Rooibos chai",
            "Boeber",
            "Ginger beer",
            "Falooda"
        ],
        answer: 1,
        fact: "Boeber is a warm milky dessert-drink that travelled with Cape Malay ancestors from Southeast Asia and became a Ramadan staple in South Africa.",
        points: 2
    },
    {
        type: "quiz",
        prompt: "Which South African city is home to the colourful Bo-Kaap neighbourhood and its historic mosques?",
        description: "The Auwal Masjid, built in 1794, still welcomes worshippers here.",
        options: [
            "Durban",
            "Johannesburg",
            "Cape Town",
            "Port Elizabeth"
        ],
        answer: 2,
        fact: "The Bo-Kaap's cobbled streets and pastel houses tell stories of freed enslaved Muslims who shaped Cape Town's Islamic heritage.",
        points: 2
    },
    {
        type: "quiz",
        prompt: "The Arabic greeting 'as-salaamu alaykum' translates to what message?",
        description: "The response is 'wa alaykum salaam'.",
        options: [
            "May your day be blessed",
            "Peace be upon you",
            "How is your family?",
            "Praise be to Allah"
        ],
        answer: 1,
        fact: "Sharing salaams spreads mercy, as taught by the Prophet Muhammad (peace be upon him).",
        points: 1
    },
    {
        type: "quiz",
        prompt: "What sweet treat do Cape Malay households serve that is rolled in coconut and has a twin in the Afrikaner kitchen?",
        description: "The Malay version is boiled and syrupy, while its cousin is deep-fried.",
        options: [
            "Koeksister",
            "Malva pudding",
            "Melktert",
            "Burfee"
        ],
        answer: 0,
        fact: "Cape Malay koesisters (with a soft \"oe\") are syrupy, spiced, and coated in coconut — perfect for Eid morning tea.",
        points: 2
    },
    {
        type: "quiz",
        prompt: "Which oceanfront Durban suburb is famous for halaal bunny chows enjoyed after Jumu'ah?",
        description: "The masjids here are a short stroll from the surf.",
        options: [
            "Chatsworth",
            "Overport",
            "Umhlanga",
            "Phoenix"
        ],
        answer: 1,
        fact: "Overport's halaal eateries fuse Indian flavours with South African flair, making it a foodie pilgrimage spot.",
        points: 2
    },
    {
        type: "quiz",
        prompt: "Which night in Ramadan encourages extra Qur'an recitation and seeking forgiveness, known for its blessings?",
        description: "Many couples stay awake together, making du'a and reflecting on gratitude.",
        options: [
            "Laylat al-Qadr",
            "Eid al-Fitr",
            "Hijri New Year",
            "Sha'ban Moon"
        ],
        answer: 0,
        fact: "Laylat al-Qadr is described in Surah al-Qadr as better than a thousand months, making every heartfelt supplication special.",
        points: 2
    },
    {
        type: "quiz",
        prompt: "Which South African mountain is often illuminated during Ramadan with the word 'Allah'?",
        description: "Hikers in Cape Town spot it shining across the city on clear nights.",
        options: [
            "Table Mountain",
            "Drakensberg",
            "Lion's Head",
            "Signal Hill"
        ],
        answer: 3,
        fact: "The calligraphy lights on Signal Hill reflect the vibrancy of Cape Town's Muslim community during Ramadan nights.",
        points: 2
    },
    {
        type: "prompt",
        prompt: "Story circle: What South African space makes you feel closest to Allah together?",
        description: "Think of a moment in Bo-Kaap, Durban's Golden Mile, or even a quiet corner at home where you shared dhikr.",
        fact: "Take your time, listen with presence, and award a point once you've both shared.",
        points: 1
    },
    {
        type: "quiz",
        prompt: "Which local charity drive sees youth packing food hampers for iftar across townships?",
        description: "It often pairs masjid volunteers with neighbourhood aunties to reach families in need.",
        options: [
            "Operation Fitrah",
            "Share the Meal",
            "Sadaqah Saturday",
            "Mercy Mission"
        ],
        answer: 0,
        fact: "Operation Fitrah boxes brim with staples like samp, beans, dates, and spice mixes that taste like home.",
        points: 2
    },
    {
        type: "prompt",
        prompt: "Du'a duet: Make a short du'a for each other's dreams this year.",
        description: "Say it aloud or type it in your call. When you're done, gift each other a point for being intentional partners.",
        fact: "The Prophet (peace be upon him) taught that angels echo a du'a you make for someone else — so your blessings return to you.",
        points: 1
    },
    {
        type: "quiz",
        prompt: "Which spice mix gives Cape Malay curry its warmth and is perfect for a Sunday potjie?",
        description: "It usually blends turmeric, coriander, cumin, and cardamom.",
        options: [
            "Garam masala",
            "Seven colours spice",
            "Masala mix",
            "Bredie blend"
        ],
        answer: 2,
        fact: "A homemade masala mix passed down from generations keeps every potjie halaal and flavourful.",
        points: 2
    },
    {
        type: "prompt",
        prompt: "Kindness quest: Share one sunnah-inspired habit you want to build together this week.",
        description: "Maybe it's sharing misbaha reminders, visiting parents, or gifting dates to a neighbour.",
        fact: "Award a point when you both commit to holding each other gently accountable.",
        points: 1
    }
];

const state = {
    players: [],
    scores: [],
    currentPlayerIndex: 0,
    currentRound: 0,
    totalRounds: 0,
    deck: [],
    locked: false
};

const setupForm = document.getElementById("setup-form");
const card = document.getElementById("card");
const promptEl = document.getElementById("prompt");
const descriptionEl = document.getElementById("description");
const optionsEl = document.getElementById("options");
const factEl = document.getElementById("fact");
const nextButton = document.getElementById("next-button");
const turnDisplay = document.getElementById("turn-display");
const roundDisplay = document.getElementById("round-display");
const scoreList = document.getElementById("score-list");

setupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const playerOne = document.getElementById("player-one").value.trim() || "Player 1";
    const playerTwo = document.getElementById("player-two").value.trim() || "Player 2";
    const rounds = Number(document.getElementById("round-count").value);

    state.players = [playerOne, playerTwo];
    state.scores = [0, 0];
    state.currentPlayerIndex = 0;
    state.currentRound = 0;
    state.totalRounds = rounds;
    state.deck = shuffle(questions).slice(0, rounds);
    state.locked = false;

    updateScoreboard();
    setupForm.reset();
    setupForm.closest("section").setAttribute("hidden", "hidden");
    card.hidden = false;
    nextButton.hidden = true;
    factEl.hidden = true;
    renderCurrentCard();
});

nextButton.addEventListener("click", () => {
    if (state.locked === false) return;
    state.currentRound += 1;
    if (state.currentRound >= state.totalRounds) {
        endGame();
        return;
    }
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    state.locked = false;
    renderCurrentCard();
});

function renderCurrentCard() {
    const current = state.deck[state.currentRound];
    roundDisplay.textContent = `Round ${state.currentRound + 1} of ${state.totalRounds}`;
    turnDisplay.textContent = `${state.players[state.currentPlayerIndex]}, it's your turn`;
    promptEl.textContent = current.prompt;
    descriptionEl.textContent = current.description ?? "";

    optionsEl.innerHTML = "";
    factEl.hidden = true;
    factEl.textContent = "";
    nextButton.hidden = true;

    if (current.type === "quiz") {
        renderOptions(current);
    } else {
        renderPromptCard(current);
    }
}

function renderOptions(question) {
    question.options.forEach((option, index) => {
        const button = document.createElement("button");
        button.className = "option-button";
        button.innerHTML = `<span>${String.fromCharCode(65 + index)}</span> ${option}`;
        button.addEventListener("click", () => handleQuizSelection(button, index));
        optionsEl.appendChild(button);
    });
}

function renderPromptCard(cardData) {
    const button = document.createElement("button");
    button.className = "option-button";
    button.textContent = "We've shared our stories";
    button.addEventListener("click", () => handlePromptCompletion(button));
    optionsEl.appendChild(button);
}

function handleQuizSelection(button, choiceIndex) {
    if (state.locked) return;
    const current = state.deck[state.currentRound];
    const correct = choiceIndex === current.answer;
    state.locked = true;

    revealAnswers(choiceIndex, current.answer);

    const playerName = state.players[state.currentPlayerIndex];
    let message = correct
        ? `Takbeer! ${playerName}, you nailed it.`
        : `Almost there, ${playerName}. Give the fact a read together.`;

    if (correct) {
        state.scores[state.currentPlayerIndex] += current.points;
    }

    factEl.textContent = `${message} ${current.fact}`;
    factEl.hidden = false;
    nextButton.hidden = false;
    updateScoreboard();
}

function handlePromptCompletion(button) {
    if (state.locked) return;
    state.locked = true;
    button.classList.add("correct");

    const current = state.deck[state.currentRound];
    state.scores[state.currentPlayerIndex] += current.points;

    factEl.textContent = current.fact;
    factEl.hidden = false;
    nextButton.hidden = false;
    updateScoreboard();
}

function revealAnswers(selectedIndex, correctIndex) {
    const buttons = optionsEl.querySelectorAll(".option-button");
    buttons.forEach((optionButton, index) => {
        optionButton.disabled = true;
        if (index === correctIndex) {
            optionButton.classList.add("correct");
        }
        if (index === selectedIndex && index !== correctIndex) {
            optionButton.classList.add("incorrect");
        }
    });
}

function endGame() {
    promptEl.textContent = "Game complete!";
    descriptionEl.textContent = "Celebrate with a du'a of gratitude and maybe plan your next halaal food adventure.";
    optionsEl.innerHTML = "";
    factEl.hidden = false;

    const [scoreOne, scoreTwo] = state.scores;
    let summary = `${state.players[0]} scored ${scoreOne} • ${state.players[1]} scored ${scoreTwo}.`;

    if (scoreOne === scoreTwo) {
        summary += " It's a blessed tie — perfect excuse for a shared dessert!";
    } else {
        const winner = scoreOne > scoreTwo ? state.players[0] : state.players[1];
        summary += ` ${winner}, treat your partner to the next Cape Malay koesister run!`;
    }

    factEl.textContent = summary;
    nextButton.hidden = true;
}

function updateScoreboard() {
    scoreList.innerHTML = "";
    state.players.forEach((player, index) => {
        const item = document.createElement("li");
        item.className = "score";
        item.innerHTML = `<span>${player}</span><span>${state.scores[index]} pts</span>`;
        scoreList.appendChild(item);
    });
}

function shuffle(items) {
    const array = [...items];
    for (let i = array.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

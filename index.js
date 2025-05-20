let firstCard;
let secondCard;
let clicks = 0;
let pairsMatched = 0;
let pairsLeft = 0;
let startTime = 0;
let gameRunning = false;
let cards = [];
let clockInterval;
const pokeapiPokemonCount = 1025

function createCard(imageSrc, widthPercentage, maxWidthPercentage) {
  const card = document.createElement("div");
  card.classList.add("card");
  card.style.width = `${widthPercentage}%`;
  card.style.maxWidth = `${maxWidthPercentage}vh`;

  const frontFace = document.createElement("img");
  frontFace.classList.add("front_face");
  frontFace.src = imageSrc;

  const backFace = document.createElement("img");
  backFace.classList.add("back_face");
  backFace.src = "assets/back.webp";

  card.appendChild(frontFace);
  card.appendChild(backFace);

  return {
    card,
    img: imageSrc,
    flipped: false,
  };
}

function handleCardClick(card) {
  if (firstCard === undefined || secondCard === undefined) {
    clicks += 1;
    document.getElementById("clicks").innerText = clicks;
  }
  if (firstCard === undefined) {
    card.card.classList.toggle("flip");
    card.card.style.pointerEvents = "none";
    firstCard = card;
  } else if (secondCard === undefined) {
    card.card.classList.toggle("flip");
    card.card.style.pointerEvents = "none";
    secondCard = card;

    if (firstCard.img !== secondCard.img) {
      setTimeout(() => {
        firstCard.card.classList.toggle("flip");
        secondCard.card.classList.toggle("flip");
        firstCard.card.style.pointerEvents = "auto";
        secondCard.card.style.pointerEvents = "auto";
        firstCard = undefined;
        secondCard = undefined;
      }, 500);
    } else {
      // Cards match, pointer events left disabled
      pairsLeft -= 1;
      pairsMatched += 1;
      document.getElementById("pairs_left").innerText = pairsLeft;
      document.getElementById("pairs_matched").innerText = pairsMatched;
      firstCard.card.flipped = true;
      secondCard.card.flipped = true;
      firstCard = undefined;
      secondCard = undefined;
      if(pairsLeft === 0) {
        winGame();
      } else if (pairsMatched % 5 === 0) {
        activatePowerUp();
      }
    }
  }
}

function reset_game() {
  if(!gameRunning) {
    return;
  }
  gameRunning = false;

  clicks = 0;
  pairsMatched = 0;
  pairsLeft = 0;
  firstCard = undefined;
  secondCard = undefined;
  clearInterval(clockInterval);
  document.getElementById("timer").innerText = 0;
  cards.forEach((card) => {
    card.card.classList.add("flip");
    card.card.style.pointerEvents = "none";
  });
  document.getElementById("start_game").disabled = false;
  document.getElementById("reset_game").disabled = true;
}

function winGame() {
  clearInterval(clockInterval);
  setTimeout(() => {
    reset_game();
    document.getElementById("game_grid").innerHTML = "<h1>You won!</h1>";
  }, 1000);
}

function lose_game() {
  clearInterval(clockInterval);
  reset_game();
  document.getElementById("game_grid").innerHTML = "<h1>You lost!</h1>";
}

function activatePowerUp() {
  cards.forEach((card) => {
    card.card.classList.add("flip");
    card.card.style.pointerEvents = "none";
  });
  setTimeout(() => {
    cards.forEach((card) => {
      if (!card.card.flipped) {
        card.card.classList.remove("flip");
        card.card.style.pointerEvents = "auto";
      }
    });
  }, 2000);
}

async function getPokemonImage(pokemonId) {
  const response = await fetch(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`);
  if (response.ok) {
    return URL.createObjectURL(await response.blob());
  } else {
    throw new Error("Failed to fetch Pokemon data");
  }
}

function getNewId(ids) {
  while(true) {
    const randomId = Math.floor(Math.random() * pokeapiPokemonCount) + 1;
    if (!ids.includes(randomId)) {
      return randomId;
    }
  }
}

async function getRandomPokemonImages(count) {
  const ids = [];
  while (ids.length < count) {
    ids.push(getNewId(ids));
  }

  const images = [];
  const promises = ids.map(async id => {
    while (true) {
      try {
        const image = await getPokemonImage(id);
        images.push(image);
        break;
      } catch (error) {
        console.error(`Error fetching Pokemon with ID ${id}: ${error}`);
        ids.splice(ids.indexOf(id), 1);
        ids.push(getNewId(ids));
      }
    }
  });
  await Promise.all(promises);
  return images;
}

async function startGame(numCards, numPerRow, secondsAllowed) {
  if(gameRunning) {
    return;
  }
  document.getElementById("start_game").disabled = true;
  document.getElementById("reset_game").disabled = false;
  if(numCards % 2 !== 0) {
    numCards += 1;
  }
  pairsLeft = numCards / 2;
  const pokemonImages = await getRandomPokemonImages(pairsLeft);
  document.getElementById("total_pairs").innerText = pairsLeft;
  
  const shuffledImages = [...pokemonImages, ...pokemonImages].sort(() => Math.random() - 0.5);

  gameRunning = true;
  document.getElementById("pairs_left").innerText = pairsLeft;
  document.getElementById("pairs_matched").innerText = 0;
  document.getElementById("clicks").innerText = 0;
  document.getElementById("game_grid").innerHTML = "";
  document.getElementById("timer").innerText = secondsAllowed;
  cards = [];

  for (let i = 0; i < numCards; i++) {
    const card = createCard(shuffledImages[i], 100 / numPerRow, 60 / (numCards / numPerRow));
    document.getElementById("game_grid").appendChild(card.card);
    cards.push(card);
  }

  cards.forEach((card) => {
    card.card.addEventListener("click", () => handleCardClick(card));
  });

  clockInterval = setInterval(() => {
    if (gameRunning) {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      if (elapsedSeconds >= secondsAllowed) {
        document.getElementById("timer").innerText = 0;
        lose_game();
      } else {
        document.getElementById("timer").innerText = secondsAllowed - elapsedSeconds;
      }
    }
  }, 1000);
}

document.getElementById("start_game").addEventListener("click", () => {
  startTime = Date.now();
  const currentDifficulty = document.getElementById("difficulty_select").value;
  switch (currentDifficulty) {
    default:
      // fallthrough
    case "easy":
      startGame(6, 3, 30);
      break;
    case "medium":
      startGame(12, 4, 40);
      break;
    case "hard":
      startGame(20, 5, 50);
      break;
    case "expert":
      startGame(24, 6, 60);
      break;
  }
});

document.getElementById("reset_game").addEventListener("click", () => {
  reset_game();
});

document.getElementById("toggle_theme").addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
});

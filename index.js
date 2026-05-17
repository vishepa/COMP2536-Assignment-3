


const DIFFICULTY = {
  easy: { pairs: 3, time: 60 },
  medium: { pairs: 6, time: 90 },
  hard: { pairs: 12, time: 120 }
};

let firstCard = null;
let secondCard = null;
let lockBoard = false;
let clicks = 0;
let matches = 0;
let totalPairs = 0;
let timeLeft = 0;
let timerInterval = null;
let gameActive = false;


// function setup () {
//   let firstCard = undefined
//   let secondCard = undefined
//   $(".card").on(("click"), function () {
//     $(this).toggleClass("flip");

//     if (!firstCard)
//       firstCard = $(this).find(".front_face")[0]
//     else {
//       secondCard = $(this).find(".front_face")[0]
//       console.log(firstCard, secondCard);
//       if (
//         firstCard.src
//         ==
//         secondCard.src
//       ) {
//         console.log("match")
//         $(`#${firstCard.id}`).parent().off("click")
//         $(`#${secondCard.id}`).parent().off("click")
//       } else {
//         console.log("no match")
//         setTimeout(() => {
//           $(`#${firstCard.id}`).parent().toggleClass("flip")
//           $(`#${secondCard.id}`).parent().toggleClass("flip")
//         }, 1000)
//       }
//     }
//   });
// }

// $(document).ready(setup)

function getRandomIds(count, max = 1025) {
  const ids = new Set();
  while (ids.size < count) {
    ids.add(Math.floor(Math.random() * max) + 1);
  }
  return [...ids];
}


async function fetchPokemonImages (ids) {
  const promises = ids.map( id =>
    fetch(`https://pokeapi.co/api/v2/pokemon/${id}`).then(r => r.json())
  );
  const results = await Promise.all(promises);
  return results.map(p => p.sprites.other["official-artwork"].front_default);
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function updateStatus() {
  $("#clicks").text(clicks);
  $("#matches").text(matches);
  $("#left").text(totalPairs - matches);
  $("#total").text(totalPairs);
  $("#time").text(timeLeft);
}

function showmessage(message) {
  $("#message").text(message);
}

function renderCards(imageUrls, difficulty) {
  const grid = $("#game_grid");
  grid.empty();
  grid.removeClass("easy medium hard").addClass(difficulty);

  imageUrls.forEach((url, index) => {
    grid.append(`
      <div class="card">
        <img id="img${index}" class="front_face" src="${url}" alt="Pokemon">
        <img class="back_face" src="stylized_poke_card_back.png" alt="Card Back">
      </div>
    `);
  });
}


function attachCardHandlers() {
  $(".card").on("click", function () {
    if (lockBoard) return;
    if ($(this).hasClass("flip")) return;
    if (!gameActive) return;

    $(this).addClass("flip");
    clicks++;
    updateStatus();

    if (!firstCard) {
      firstCard = $(this).find(".front_face")[0];
      return;
    }

    secondCard = $(this).find(".front_face")[0];
    lockBoard = true;

    if (firstCard.src === secondCard.src) {
      
      $(`#${firstCard.id}`).parent().off("click");
      $(`#${secondCard.id}`).parent().off("click");
      matches++;
      updateStatus();
      resetBoard();


      if (matches === totalPairs) {
        endGame(true);
      }
    } else {

      setTimeout(() => {
        $(`#${firstCard.id}`).parent().removeClass("flip");
        $(`#${secondCard.id}`).parent().removeClass("flip");
        resetBoard();
      }, 1000);
    }
  });
  
}

function resetBoard() {
  firstCard = null;
  secondCard = null;
  lockBoard = false;
}

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft--;
    updateStatus();
    if (timeLeft <= 0) {
      endGame(false);
    }
  }, 1000);
}

async function startGame() {
  const difficulty = $("#difficulty_select").val();
  if (!difficulty) {
    showmessage("Please select a difficulty level.");
    return;
  }

  const config = DIFFICULTY[difficulty];
  totalPairs = config.pairs;
  timeLeft = config.time;
  clicks = 0;
  matches = 0;
  gameActive = false;
  resetBoard();
  clearInterval(timerInterval);
  showmessage("Loading Pokemon...");

  try {
    const ids = getRandomIds(config.pairs);
    const images = await fetchPokemonImages(ids);
    const cardImages = shuffle([...images, ...images]);
    renderCards(cardImages, difficulty);
    attachCardHandlers();
    updateStatus();
    gameActive = true;
    startTimer();
  } catch (err) {
    showmessage("Failed to load Pokemon. Please try again.");
    console.error(err);
  }

}

function endGame(won) {
  gameActive = false;
  clearInterval(timerInterval);
  $(".card").off("click");
  showmessage(won ? "Wowowow! You must be one of them smart people!" : "Dude, its a memory game....");

}

function toggleTheme() {
  const current = $("html").attr("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  $("html").attr("data-theme", next);
  $("#theme_btn").text(next === "dark" ? "🌙 Dark" : "☀️ Light");
  localStorage.setItem("theme", next);
}

function loadTheme() {
  const saved = localStorage.getItem("theme") || "dark";
  $("html").attr("data-theme", saved);
  $("#theme_btn").text(saved === "dark" ? "🌙 Dark" : "☀️ Light");
}


$(document).ready(() => {
  $("#start_btn").on("click", startGame);
  $("#reset_btn").on("click", startGame);
  $("#theme_btn").on("click", toggleTheme);
  loadTheme();
});

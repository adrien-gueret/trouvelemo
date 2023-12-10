(async () => {
  function getRandomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function normalizeWord(word) {
    return word
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\- ]/g, "");
  }

  function hasDoubleLetters(word) {
    const seenLetters = {};

    for (let letter of word) {
      if (letter in seenLetters) {
        return true;
      }
      seenLetters[letter] = 1;
    }

    return false;
  }

  function countCommonLetters(word1, word2) {
    const set1 = new Set(word1);
    const set2 = new Set(word2);
    let commonLettersCount = 0;

    set1.forEach((letter) => {
      if (set2.has(letter)) {
        commonLettersCount++;
      }
    });

    return commonLettersCount;
  }

  const loaderContainer = document.getElementById("loader-container");

  let loaderTimeout = null;

  function showLoader() {
    loaderTimeout = window.setTimeout(() => {
      loaderContainer.classList.add("show");
      loaderTimeout = null;
    }, 333);
  }

  function hideLoader() {
    if (loaderTimeout) {
      window.clearTimeout(loaderTimeout);
    }
    loaderContainer.classList.remove("show");
  }

  showLoader();

  const alphabet = document.getElementById("alphabet-container");
  alphabet.onclick = (e) => {
    if ("letter" in e.target.dataset) {
      e.preventDefault();

      const letter = e.target.dataset.letter;

      switch (document.body.dataset[letter]) {
        case "1":
          delete document.body.dataset[letter];
          break;

        case "0":
          document.body.dataset[letter] = "1";
          break;

        default:
          document.body.dataset[letter] = "0";
          break;
      }
    }
  };

  function resetAlphabet() {
    for (let letterTag of alphabet.querySelectorAll("input[data-letter]")) {
      delete document.body.dataset[letterTag.dataset.letter];
    }
  }

  document.getElementById("reset").onclick = (e) => {
    e.preventDefault();
    resetAlphabet();
  };

  const wordList = document.getElementById("word-list");

  try {
    const response = await fetch("./mots_cleaned.txt");

    if (!response.ok) {
      throw new Error(
        "Erreur de réseau lors de la tentative de récupération du fichier."
      );
    }

    const fileContent = await response.text();

    const allWords = fileContent.split(/\n/);

    const formGame = document.forms.game;

    function resetCustomError() {
      formGame.elements.answer.setCustomValidity("");
    }

    formGame.elements.answer.onkeydown = resetCustomError;
    formGame.elements.answer.onchange = resetCustomError;

    function wrongWord() {
      formGame.elements.answer.setCustomValidity(
        "Ce mot ne semble pas exister dans la langue française."
      );
      formGame.elements.answer.addEventListener(
        "animationend",
        () => {
          formGame.elements.answer.classList.remove("shake");
        },
        {
          once: true,
        }
      );
      formGame.elements.answer.classList.add("shake");
      formGame.elements.answer.reportValidity();
    }

    function startGame(totalOfLetters) {
      const allWordWithThisNumberOfLetters = allWords.filter(
        (w) => w.length === totalOfLetters
      );

      const allWordWithThisNumberOfLettersWithoutDoubleLetters =
        allWordWithThisNumberOfLetters.filter((w) => !hasDoubleLetters(w));

      const wordToGuess = getRandomItem(
        allWordWithThisNumberOfLettersWithoutDoubleLetters
      ).toLowerCase();

      function addGuess(answer) {
        const commonLetters = countCommonLetters(answer, wordToGuess);

        const newTry = document.createElement("li");
        newTry.innerHTML =
          answer
            .split("")
            .map(
              (x) =>
                `<span class="letter" data-letter="${x.toLowerCase()}">${x}</span>`
            )
            .join("") +
          "<span class='count'>" +
          commonLetters +
          "</span>";

        wordList.prepend(newTry);

        formGame.reset();
        formGame.elements.answer.focus();
      }

      async function guess(answer) {
        if (answer === wordToGuess) {
          alert("C'est gagné !");
        } else if (!allWordWithThisNumberOfLetters.includes(answer)) {
          try {
            showLoader();
            const request = await fetch(
              "https://dictionnaire.lerobert.com/autocomplete.json?t=def&q=" +
                answer,
              {
                method: "GET",
              }
            );

            const response = await request.json();

            const doesWordExist = response.some(
              ({ term }) => normalizeWord(term) === answer
            );

            if (doesWordExist) {
              addGuess(answer);
            } else {
              wrongWord();
            }
          } catch (e) {
            wrongWord();
          }

          hideLoader();
        } else {
          addGuess(answer);
        }
      }

      console.log(wordToGuess);

      formGame.elements.answer.minLength = totalOfLetters;
      formGame.elements.answer.maxLength = totalOfLetters;

      document.getElementById("numberOfLetters").innerHTML = totalOfLetters;

      formGame.onsubmit = (e) => {
        e.preventDefault();

        guess(normalizeWord(formGame.elements.answer.value));
      };
    }

    startGame(5);

    hideLoader();
  } catch (error) {
    console.error("Erreur lors de la récupération du fichier :", error);
  }
})();

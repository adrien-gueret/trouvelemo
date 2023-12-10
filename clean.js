const fs = require("fs");
const readline = require("readline");

async function filterWords(filePath) {
  const fileStream = fs.createReadStream(filePath, { encoding: "utf-8" });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  const filteredWords = [];

  for await (const word of rl) {
    if (
      !isProperNoun(word) &&
      !word.includes(" ") &&
      !word.includes("-") &&
      word.length >= 3 &&
      word.length < 8
    ) {
      const cleanedWord = word
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9\- ]/g, "");

      if (!filteredWords.includes(cleanedWord)) {
        filteredWords.push(cleanedWord);
      }
    }
  }

  fs.writeFileSync("mots_cleaned.txt", filteredWords.join("\n"));
  console.log("Fichier mis à jour avec des mots filtrés.");
}

function isProperNoun(word) {
  return word.charAt(0) === word.charAt(0).toUpperCase();
}

const filePath = "mots.txt";
filterWords(filePath);

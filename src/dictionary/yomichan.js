import JSZip from 'jszip';

const fs = window.require('fs-extra');

const loadBank = async (zip) => {
  console.time('loadBank');
  let num = 1;
  const parts = [];

  while (true) {
    const fn = `term_bank_${num}.json`;
    if (!zip.files[fn]) {
      break;
    }
    parts.push(JSON.parse(await zip.files[fn].async('string')));
    num++;
  }

  const entries = parts.reduce((acc, val) => acc.concat(val), []);
  console.timeEnd('loadBank');
  return entries;
};

export const loadYomichanZip = async (fn) => {
  console.time('load yomichan zip ' + fn);
  const data = fs.readFileSync(fn);
  const zip = await JSZip.loadAsync(data);
  const keys = Object.keys(zip.files);
  keys.sort();

  const indexObj = JSON.parse(await zip.files['index.json'].async('string'));
  if (indexObj.format !== 3) {
    throw new Error('wrong format');
  }
  if (!indexObj.sequenced) { 
    throw new Error('not sequenced?');
  }

  const termEntries = await loadBank(zip);
  console.timeEnd('load yomichan zip ' + fn);
  return {
    name: indexObj.title,
    termEntries,
  };
};

export const indexYomichanEntries = (subentries) => {
  console.time('indexYomichanEntries');
  const sequenceToEntry = new Map(); // sequence (id) -> macro-entry object
  const wordOrReadingToSequences = new Map(); // string -> Set(sequence ids)

  console.log('subentries.length ' + subentries.length);
  for (const subentry of subentries) {
    const word = subentry[0];
    const reading = subentry[1];
    const glosses = subentry[5].join('; ');
    const sequence = subentry[6];

    let record;
    if (sequenceToEntry.has(sequence)) {
      record = sequenceToEntry.get(sequence);
    } else {
      record = {
        words: new Set(),
        readings: new Set(),
        glosses: new Set(),
      };
      sequenceToEntry.set(sequence, record);
    }

    record.words.add(word);
    if (reading) {
      record.readings.add(reading);
    }
    record.glosses.add(glosses);

    if (!wordOrReadingToSequences.has(word)) {
      wordOrReadingToSequences.set(word, new Set());
    }
    wordOrReadingToSequences.get(word).add(sequence);

    if (reading) {
      if (!wordOrReadingToSequences.has(reading)) {
        wordOrReadingToSequences.set(reading, new Set());
      }
      wordOrReadingToSequences.get(reading).add(sequence);
    }
  }

  console.timeEnd('indexYomichanEntries');
  return {
    sequenceToEntry,
    wordOrReadingToSequences,
  }
};

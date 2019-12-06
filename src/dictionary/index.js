import path from 'path';

import { getResourcesPath, getUserDataPath } from '../util/appPaths';
import { loadYomichanZip, indexYomichanEntries } from './yomichan';
export { importEpwing } from './epwing';

const fs = window.require('fs-extra'); // use window to avoid webpack

const loadAndIndexYomichanZip = async (zipfn, builtin) => {
  console.time('loadYomichanZip');
  const {name, termEntries} = await loadYomichanZip(zipfn);
  console.timeEnd('loadYomichanZip');
  return {
    name,
    index: indexYomichanEntries(termEntries),
    builtin,
    filename: zipfn,
  };
};

const scanDirForYomichanZips = async (dir, builtin) => {
  const result = [];
  const dirents = fs.readdirSync(dir);
  for (const dirent of dirents) {
    if (path.extname(dirent) === '.zip') {
      // Assume any zips are Yomichan dicts
      const info = await loadAndIndexYomichanZip(path.join(dir, dirent), builtin);
      result.push(info);
    }
  }
  return result;
};

export const loadDictionaries = async () => {
  console.time('loadDictionaries');
  const result = [];

  // Scan for built-in dictionaries
  console.time('scanDirForYomichanZips');
  result.push(...await scanDirForYomichanZips(path.join(getResourcesPath(), 'dictionaries'), true));
  console.timeEnd('scanDirForYomichanZips');

  // Scan for imported dictionaries
  console.time('Scan for imported dictionaries');
  const importedPath = path.join(getUserDataPath(), 'dictionaries');
  if (await fs.exists(importedPath)) {
    result.push(...await scanDirForYomichanZips(path.join(getUserDataPath(), 'dictionaries'), false));
  }
  console.timeEnd('Scan for imported dictionaries');

  console.timeEnd('loadDictionaries');
  return result;
};

export const searchIndex = (index, word) => {
  const result = [];
  const sequences = index.wordOrReadingToSequences.get(word);
  if (sequences) {
    for (const seq of sequences) {
      const entry = index.sequenceToEntry.get(seq);
      result.push(Array.from(entry.glosses).join('\n'));
    }
  }

  return result;
};

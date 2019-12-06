import path from 'path';

import { getResourcesPath, getUserDataPath } from '../util/appPaths';
import { loadYomichanZip, indexYomichanEntries } from './yomichan';
export { importEpwing } from './epwing';

const fs = window.require('fs-extra'); // use window to avoid webpack

const loadAndIndexYomichanZip = async (zipfn, builtin) => {
  const {name, termEntries} = await loadYomichanZip(zipfn);
  return {
    name,
    index: indexYomichanEntries(termEntries),
    builtin,
    filename: zipfn,
  };
};

const scanDirForYomichanZips = async (dir, builtin) => {
  const result = [];
  const dirents = await fs.readdir(dir);
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
  const result = [];

  // Scan for built-in dictionaries
  result.push(...await scanDirForYomichanZips(path.join(getResourcesPath(), 'dictionaries'), true));

  // Scan for imported dictionaries
  const importedPath = path.join(getUserDataPath(), 'dictionaries');
  if (await fs.exists(importedPath)) {
    result.push(...await scanDirForYomichanZips(path.join(getUserDataPath(), 'dictionaries'), false));
  }

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

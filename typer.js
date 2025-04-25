const blessed = require('blessed');
const fs = require('fs');
const path = require('path');

// Directory to read files from (change as needed)
const CODE_DIR = './../as_drive/ws/src/as_drive_nodes/';
const FILE_EXT = '.cpp';

// Create screen object
const screen = blessed.screen({
  smartCSR: true,
  title: 'Code Typing Practice'
});

// Create a box to display the code
const codeBox = blessed.box({
  top: '55',
  left: 0,
  width: '100%',
  height: '90%',
  tags: true,
  style: {
    fg: 'gray',
    bg: 'default'
  },
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  vi: true,
  mouse: false,
  content: ''
});
// Create a box to display the code
const box = blessed.box({
  top: 0,
  left: 0,
  width: '100%',
  height: '50',
  tags: true,
  style: {
    fg: 'gray',
    bg: '#a5a5a5'
  },
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  vi: true,
  mouse: true,
  content: 'sdasdasdd'
});
screen.append(box);
screen.append(codeBox);

let codeContent = '';
let filteredContent = '';
let typedContent = '';

function getAllFiles(dir, ext, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, ext, fileList);
    } else if (fullPath.endsWith(ext)) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function pickRandomFile(dir, ext) {
  const allFiles = getAllFiles(dir, ext);
  if (allFiles.length === 0) throw new Error('No code files found.');
  return allFiles[Math.floor(Math.random() * allFiles.length)];
}

function loadCodeFile() {
  try {
    const filePath = pickRandomFile(CODE_DIR, FILE_EXT);
    codeContent = fs.readFileSync(filePath, 'utf8');
    const lines = codeContent.split('\n');
    const start = Math.floor(Math.random() * lines.length / 2);
   
    codeContent = lines.splice(start).join('\n');
    updateDisplay();
  } catch (err) {
    codeBox.setContent('Error loading file: ' + err.message);
    screen.render();
  }
}

function addTag(character, tag){

  const a = character === '\n' ? ' ' : character;
  const b = character === '\n' ? '\n' : '';
  return `{${tag}}${a}{/${tag}}${b}`;
}

function red(character){
  return addTag(character, 'red-bg');
}

function yellow(character){
  return addTag(character, 'yellow-bg');
}

function isWhiteCharacter(character){
    return character === ' ' || character === '\n';
}

let errors = [];
function pushError(errorIdx){
  if (!errors.includes(errorIdx)){
    errors.push(errorIdx);
  }
}

function updateDisplay() {
  let display = '';
  const lines = codeContent.split('\n');
  let typedIndex = 0;

  let cursor = false;
  let newLine = false;
  let error = false;

  for (let line of lines) {
    if (line.trim().startsWith('//')) {
      display += `{#444444-fg}${line}{/#444444-fg}\n`;
      continue;
    }

    let isBeginWhiteCharacter = true;
    line += '\n';
    for (let i = 0; i < line.length; i++) {

      const actualChar = line[i];
      const typedChar = typedContent[typedIndex];
      isBeginWhiteCharacter = isWhiteCharacter(actualChar) && isBeginWhiteCharacter;

      if (isBeginWhiteCharacter){
        display += actualChar;
        continue;
      }
      else if(!cursor && typedChar === undefined && !newLine){
        display += yellow(actualChar);
        cursor = true;
      }
      else if(actualChar === '\n' && (typedChar === undefined || typedChar === '\n')){
        display += '\n';
      }
      else if(newLine && error){
        display += red(actualChar);
      }
      else if (typedChar === undefined || newLine) {
        display += `{#b5b5b5-fg}${actualChar}{/#b5b5b5-fg}`;
      } else if (typedChar === actualChar && !error) {
        if (errors.includes(typedIndex)){
          display += `{yellow-fg}${actualChar}{/yellow-fg}`;
        }
        else{
          display += `{green-fg}${actualChar}{/green-fg}`;
        }
      } else if(typedChar === '\n'){
        newLine = true;
        typedIndex++;
        display += red(actualChar);
        pushError(typedIndex);
        error = true;
      } else {
        error = true;
        pushError(typedIndex);
        display += red(actualChar);
      }
      if(!newLine)
      {
        typedIndex++;
      };
    }
    newLine = false;
  }
  codeBox.setContent(display);
  box.setContent(JSON.stringify(errors));
  screen.render();
}

screen.key(['escape', 'C-c'], () => process.exit(0));

screen.on('keypress', (ch, key) => {
  if (key.full === 'backspace' || key.full === 'C-h') {
    typedContent = typedContent.slice(0, -1);
  }
  else if (key.full === 'return') {
  }
  else if (key.full === 'enter') {
    typedContent += '\n';
  } else if (typeof ch === 'string'){
    typedContent += ch;
  }
  updateDisplay();
});

loadCodeFile();

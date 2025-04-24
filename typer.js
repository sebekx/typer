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
  top: 0,
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
  mouse: true,
  content: ''
});
// Create a box to display the code
const box = blessed.box({
  top: 0,
  left: 0,
  width: '100%',
  height: '10%',
  tags: true,
  style: {
    fg: 'gray',
    bg: 'default'
  },
  scrollable: true,
  alwaysScroll: true,
  keys: true,
  vi: true,
  mouse: true,
  content: ''
});
screen.append(codeBox);
// screen.append(box);

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
    filteredContent = lines
      .filter(line => !line.trim().startsWith('//'))
      .join('\n');
    updateDisplay();
  } catch (err) {
    codeBox.setContent('Error loading file: ' + err.message);
    screen.render();
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

    line += '\n';
    for (let i = 0; i < line.length; i++) {
      const actualChar = line[i];
      const typedChar = typedContent[typedIndex];

      if(!cursor && typedChar === undefined && !newLine){

        if(actualChar === '\n'){
          display += `{yellow-fg}{underline} {/underline}{/yellow-fg}\n`;
        }
        else{
          display += `{yellow-fg}{underline}${actualChar}{/underline}{/yellow-fg}`;
        }
        cursor = true;
      }
      else if(actualChar === '\n' && (typedChar === undefined || typedChar === '\n')){
        display += '\n';
      }
      else if(newLine && error){

        if(actualChar === '\n'){
        
          display += `{red-bg} {/red-bg}\n`;
        }else{
          display += `{red-bg}${actualChar}{/red-bg}`;
        }
      }
      else if (typedChar === undefined || newLine) {
        display += `{gray-fg}${actualChar}{/gray-fg}`;
      } else if (typedChar === actualChar && !error) {
        display += `{green-fg}${actualChar}{/green-fg}`;
      } else if(typedChar === '\n'){
        newLine = true;
        typedIndex++;
        display += `{red-bg}${actualChar}{/red-bg}`;
        error = true;
      } else {
        error = true;
        if(actualChar === '\n'){
        
          display += `{red-bg} {/red-bg}\n`;
        }else{
          display += `{red-bg}${actualChar}{/red-bg}`;
        }
      }
      if(!newLine)
      {
        typedIndex++;
      };
    }
    newLine = false;
    // display += '\n';
  }
  codeBox.setContent(display);
  // box.setContent(typedContent);
  screen.render();
}

screen.key(['escape', 'q', 'C-c'], () => process.exit(0));

screen.on('keypress', (ch, key) => {
  if (key.full === 'backspace' || key.full === 'C-h') {
    typedContent = typedContent.slice(0, -1);
  }
  else if (key.full === 'return') {
  }
  else if (key.full === 'enter') {
    typedContent += '\n';
  } else if (typeof ch === 'string' && typedContent.length < filteredContent.length) {
    typedContent += ch;

  }
  updateDisplay();
});

loadCodeFile();

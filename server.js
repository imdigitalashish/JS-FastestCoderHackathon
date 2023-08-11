// write a simple nodejs server which read and writes from a .json format


const express = require('express');
const fs = require('fs');
const app = express();
const cors = require('cors');

const jsonFileName = 'data.json';
const logFileName = 'logs.txt';

// Middleware to parse JSON data
app.use(cors({
  origin: '*',
  methods: '*',
  allowedHeaders: '*'
}));
app.use(express.json());

app.use(express.static("public"))

// Read data from JSON file
function readData() {
  try {
    const data = fs.readFileSync(jsonFileName);
    return JSON.parse(data);
  } catch (err) {
    logError('Error reading data:', err);
    return [];
  }
}

// Write data to JSON file
function writeData(data) {
  try {
    fs.writeFileSync(jsonFileName, JSON.stringify(data, null, 2));
    console.log('Data written successfully.');
  } catch (err) {
    logError('Error writing data:', err);
  }
}

// Log errors to logs.txt file
function logError(message, err) {
  const logEntry = `${new Date().toISOString()} - ${message}\n${err.stack}\n\n`;
  fs.appendFileSync(logFileName, logEntry);
}

// Get all items
app.get('/items', (req, res) => {
  const data = readData();
  res.json(data);
});

// Add a new item
app.post('/items', (req, res) => {
  const newItem = req.body;
  const data = readData();

  data.push(newItem);
  writeData(data);

  res.json({ message: 'Item added successfully.' });
});

// Delete an item by ID
app.delete('/items/:id', (req, res) => {
  const itemId = parseInt(req.params.id);
  const data = readData();

  const filteredData = data.filter(item => item.id !== itemId);
  if (filteredData.length === data.length) {
    res.status(404).json({ message: 'Item not found.' });
  } else {
    writeData(filteredData);
    res.json({ message: 'Item deleted successfully.' });
  }
});

// Get items by user
app.get('/items/user/:user', (req, res) => {
  const user = req.params.user;
  const data = readData();

  const filteredData = data.filter(item => item.user === user);
  if (filteredData.length === 0) {
    res.status(404).json({ message: 'No items found for the user.' });
  } else {
    res.json(filteredData);
  }
});

// Start the server
app.listen(3000, () => {
  console.log('Server is running on port 3000.');
});

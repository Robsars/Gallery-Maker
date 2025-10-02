const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// This server is minimal. Its primary role in a real-world scenario might be
// to serve the static gallery or provide an API to trigger CLI commands.
// For this project, the CLI is the main entry point for processing.

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
  console.log('This server is a placeholder. Use the CLI for all operations.');
});
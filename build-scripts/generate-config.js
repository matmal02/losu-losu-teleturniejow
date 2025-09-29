const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Node-only

// Get values from environment variables
const sheetId = process.env.SHEET_ID;
const apiKey = process.env.GOOGLE_API;

if (!sheetId || !apiKey) {
    console.error("SHEET_ID or API_KEY missing in .env");
    process.exit(1);
}

// Generate the RequireJS module
const configContent = `
define([], function() {
    return {
        losulosu: {
            spreadsheet_id: "${sheetId}",
            api_key: "${apiKey}"
        }
    };
});
`;

const outputFile = path.join(__dirname, '../source/scripts/config/sheetConfig.js');
fs.writeFileSync(outputFile, configContent, 'utf8');
console.log("sheetConfig.js generated at:", outputFile);

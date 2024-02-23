const fs = require('fs');

// read the file varToConcept.json
fs.readFile('jsons/varToConcept.json', 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  
const varToConcept = JSON.parse(data);

const varToConceptArray = Object.entries(varToConcept);

const invalidKeyValueObjectsArray = []
for (let i = 0; i < varToConceptArray.length; i++) {
    const [key, value] = varToConceptArray[i];
    
    const trimmedValue = value.trim();
  if (value.trim().length !== 9) {
    console.log(key);
    console.log(value);
    invalidKeyValueObjectsArray.push({[key]: value});
  }
}
console.log("invalidKeyValueObjectsArray", invalidKeyValueObjectsArray);
});

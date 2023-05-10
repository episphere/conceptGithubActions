const fs = require('fs');

const concept = require('./conceptCopy');
// let file='./csvCopy/smallTest.csv' // References to the csvCopy/masterFile 

let file='./csvCopy/coughRunTest.csv' // References to the csvCopy/coughRunTest 
concept.readFile(file)

/*
let fileName = "./csv/testing1.csv"
let toReplace = fs.readFileSync(fileName,{encoding:'utf8', flag:'r'})
//console.log(toReplace)
toReplace = toReplace.replace(/�/g, "\"\"")
fs.writeFileSync(fileName, toReplace)*/
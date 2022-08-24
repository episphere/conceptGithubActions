const fs = require('fs');

const concept = require('./concept');
let file='./csv/masterFile.csv'
concept.readFile(file)

/*
TEST YOUR OWN FILES HERE
let file='./csv/masterFile1.csv'
concept.readFile(file)
*/ 

/*
let fileName = "./csv/testing1.csv"
let toReplace = fs.readFileSync(fileName,{encoding:'utf8', flag:'r'})
//console.log(toReplace)
toReplace = toReplace.replace(/�/g, "\"\"")
fs.writeFileSync(fileName, toReplace)*/
const fs = require('fs');

const concept = require('./concept1QuestionText');
let file='./csv/testing3.csv'
concept.readFile(file)

/*
let fileName = "./csv/testing1.csv"
let toReplace = fs.readFileSync(fileName,{encoding:'utf8', flag:'r'})
//console.log(toReplace)
toReplace = toReplace.replace(/�/g, "\"\"")
fs.writeFileSync(fileName, toReplace)*/
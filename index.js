const concept = require('./concept');
const aggregate = require('./aggregateJSONS.js');
const fs = require('fs');
const otherDirection = require('./otherDirection');
let files = fs.readFileSync('files.csv', {encoding:'utf8'})
files = files.split(',')
console.log(files)


let changed = false;
for(let i = 0; i < files.length; i++){
    let file = files[i]
    if(file.indexOf('.csv') != -1){
        const fs = require('fs');
        fs.readdirSync('./jsons/').forEach(file => {
            if(file.includes('.json')){
                fs.unlink('./jsons/' + file, (err) => {
                    if(err){
                        console.error(err)
                        return
                    }
                })        
            }
        })
        concept.readFile(file)
        changed = true;
        i = files.length;
    }
    /*else if(file.match(/[0-9]+.json/)){
        otherDirection.reverseRead()
        i = files.length;
        changed = true;
    }*/
    
}

/*
if(changed){
    aggregate.aggregate();
}*/

const concept = require('./concept');
const parse = require('./masterParsing.js')
const aggregate = require('./aggregateJSONS.js');

const fs = require('fs');
// const otherDirection = require('./otherDirection');
let files = fs.readFileSync('files.csv', {encoding:'utf8'})
files = files.split(',')
console.log(files)


let changed = false;
for(let i = 0; i < files.length; i++){
    let file = files[i]
    if(file.includes("masterFile.csv")){
        const fs = require('fs');
        fs.readdirSync('./jsons/').forEach(file => {
            if((file.match(/[0-9]+.json/))){
                fs.unlink('./jsons/' + file, (err) => {
                    if(err){
                        console.error(err)
                        return
                    }
                })        
            }
        })
        concept.readFile(file).then(() => {
          parse.parseMasterModule()
          aggregate.aggregate()
        }).catch(error => {console.log(error)})
        // changed = true;
        i = files.length;
    }
    /*else if(file.match(/[0-9]+.json/)){
        otherDirection.reverseRead()
        i = files.length;
        changed = true;
    } */
    
}
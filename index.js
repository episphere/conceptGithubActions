const concept = require('./concept');
const fs = require('fs');
const otherDirection = require('./otherDirection');
let files = fs.readFileSync('files.csv', {encoding:'utf8'})
files = files.split(',')
console.log(files)

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
        fs.readdirSync('./csv/').forEach(f => {
            if(f.includes(".csv")){
                concept.readFile('./csv/' + f)
            }
        });
        
        i = files.length;
    }
    else if(file.indexOf('.json') != -1){
        otherDirection.reverseRead()
        i = files.length;
    }
    
}


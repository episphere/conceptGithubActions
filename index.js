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
        fs.readdirSync('./json/').forEach(file => {
            if(file.includes('.json')){
                fs.unlink('./json/' + file, (err) => {
                    if(err){
                        console.error(err)
                        return
                    }
                })        
            }
        })
        concept.readFile(file)
        i = files.length;
    }
    else if(file.indexOf('.json') != -1){
        otherDirection.reverseRead()
        i = files.length;
    }
    
}


const fs = require('fs');

function parseMasterModule(){
    let masterJSON = {};
    let fileList = [];
    files = fs.readdirSync('./jsons');
    files.forEach(function(file) {
        if(file.match(/[0-9]{9}.json/) != null){
            let currJSON = fs.readFileSync('./jsons/' + file, {encoding:'utf8'});
            masterJSON[file.substring()] = JSON.parse(currJSON);
        }
    });


    let keys = Object.keys(masterJSON);
    let toReturn = {};
    let varNameToConcept = {};
    for(let i = 0; i < keys.length; i++){
        let currJSON = masterJSON[keys[i]];
        if(currJSON['conceptId'] && currJSON['Variable Name']){
            varNameToConcept[currJSON['Variable Name']] = currJSON['conceptId'];
        }
    }

    let toCheckIds = [];
    for(let i = 0; i < keys.length; i++){

        let currJSON = masterJSON[keys[i]];
        
        if(currJSON['Primary Source'] && currJSON['Primary Source'] === "129084651.json"){
            //Checks for module name
            if(currJSON['Secondary Source'] && ["745268907.json","898006288.json","965707586.json"].includes(currJSON['Secondary Source'])){

                if(currJSON['Connect Value for Select all that apply questions']){
                    let isTB = false;
                    let header = currJSON['Connect Value for Select all that apply questions'];
                    let toInsert = {};
                    let headerName = currJSON['Connect Value for Select all that apply questions']

                    if(!currJSON['Quest_Src Question']){                    

                        if(currJSON['Connect Value']){
                            isTB = false;
                            let keys = Object.keys(currJSON['Connect Value'])

                            if(toReturn[headerName]){
                                toInsert = toReturn[headerName];
                            }
                            if(!toInsert['questIds']){
                                toInsert = {'questIds':{}}
                            }
                            let questIds = toInsert['questIds']

                            for(let j = 0; j < keys.length; j++){
                                if(!masterJSON[keys[j]]){
                                    console.log(keys[j])
                                }
                                questIds[currJSON['Connect Value'][keys[j]]] = {
                                    "conceptId": keys[j].substring(0,9),
                                    "concept": masterJSON[keys[j]]['Variable Name']
                                }
                            }
                            if(currJSON['Connect Value for Select all that apply questions'] === undefined){
                                console.log(currJSON)
                            }
                            toInsert['questionText'] = currJSON['Question Text']
                            toInsert['conceptId'] = currJSON['conceptId'];
                            toReturn[currJSON['Connect Value for Select all that apply questions']] = toInsert;
                            
                        }
                        else{
                            isTB = true;
                            toInsert['isTextBox'] = isTB;
                            toInsert['questionText'] = currJSON['Question Text']
                            toInsert['conceptId'] = currJSON['conceptId'];
                            toReturn[currJSON['Connect Value for Select all that apply questions']] = toInsert;
                            
                        }
                        

                    }
                    //check if it is a text response (Connect Value)
                    else{
                        if(currJSON['Connect Value']){
                            isTB = false;
                        }
                        else{
                            isTB = true;
                        }
                        headerName = currJSON['Quest_Src Question'];

                        if(toReturn[headerName]){
                            toInsert = toReturn[headerName];
                        }
                        else{
                            toInsert = {'questIds':{}}
                        }
                        //console.log(toInsert);
                        let questIds = toInsert['questIds']

                        //console.log(questIds)
                        questIds[currJSON['Connect Value for Select all that apply questions']] = {
                            "conceptId" : currJSON['conceptId'],
                            "concept": currJSON["Question Text"]
                        }
                        if(isTB){
                            questIds[currJSON['Connect Value for Select all that apply questions']]['isTextBox'] = true;
                        }
                        if(currJSON['Source Question']){
                            toInsert['conceptId'] = currJSON['Source Question'].substring(0,9);
                            toInsert['concept'] = masterJSON[currJSON['Source Question']]['Variable Name'];
                        }
                        toReturn[headerName] = toInsert;
                    }
                }
            }
        }
    }
    //console.log(JSON.stringify(toReturn))
    //console.log(toCheckIds)
    fs.writeFileSync('testDict.json', JSON.stringify(toReturn,null, 2));
    //fs.writeFileSync('toCheckIDs.json', JSON.stringify(toCheckIds,null, 2));

    //console.log(JSON.stringify(toReturn));

    /*
    if(changed){
        aggregate.aggregate();
    }*/
}
module.exports = {
    parseMasterModule:parseMasterModule
}
parseMasterModule();
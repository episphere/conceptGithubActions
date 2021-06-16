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
            if(currJSON['Secondary Source'] && ["745268907.json","965707586.json", "898006288.json", "726699695.json"].includes(currJSON['Secondary Source'])){

                if(currJSON['Connect Value for Select all that apply questions']){
                    let isTB = false;
                    let header = currJSON['Connect Value for Select all that apply questions'];
                    let toInsert = {};
                    let headerName = currJSON['Connect Value for Select all that apply questions']
                    
                    if(!currJSON['Quest_Src Question']){                    

                        if(currJSON['Connect Value'] && Array.isArray(currJSON['Connect Value'])){
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
                                    //console.log(keys[j])
                                    //console.log(keys)
                                    //console.log(currJSON)
                                }
                                questIds[currJSON['Connect Value'][keys[j]]] = {
                                    "conceptId": keys[j].substring(0,9),
                                    "concept": masterJSON[keys[j]]['Variable Name']
                                }
                            }
                            if(currJSON['Connect Value for Select all that apply questions'] === undefined){
                                //console.log(currJSON)
                            }
                            toInsert['questionText'] = currJSON['Question Text']
                            toInsert['conceptId'] = currJSON['conceptId'];
                            toReturn[currJSON['Connect Value for Select all that apply questions']] = toInsert;
                            
                        }
                        else{
                            let val = currJSON['Connect Value']
                            if(!val){
                                if(currJSON['Old Quest Value'] == "Don't know"){
                                    isTB = false;
                                    toInsert['questIds'] = {
                                        "77":{
                                            "conceptId":"178420302",
                                            "concept":"Don't Know" 
                                        }
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
                            else if(typeof val === 'object' && val !== null){
                               let objKeys = Object.keys(val);
                               let qIds = {}
                               for(let k = 0; k < objKeys.length; k++){
                                    qIds[val[objKeys[k]]] = {
                                        "conceptId":objKeys[k].substring(0,9),
                                        "concept":masterJSON[objKeys[k]]['Variable Name']
                                    }
                                }
                                toInsert['questIds'] = qIds;
                                toInsert['questionText'] = currJSON['Question Text']
                                toInsert['conceptId'] = currJSON['conceptId'];
                                toReturn[currJSON['Connect Value for Select all that apply questions']] = toInsert;
                            }
                            else{
                                if(val.includes('=')){
                                   //console.log(val)
                                   let keyNum = val.split('=')[0].trim();
                                   let valNum = val.split('=')[1].trim();
                                   isTB = false;
                                   toInsert['questIds'] = {}
                                   toInsert['questIds'][keyNum] = {
                                       "conceptId":masterJSON[valNum]?masterJSON[valNum]['conceptId']: '',
                                       "concept":valNum
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
                        if(!Array.isArray(headerName)){
                            if(toReturn[headerName]){
                                toInsert = toReturn[headerName];
                            }
                            else{
                                toInsert = {'questIds':{}}
                            }
                            if(!toInsert['questIds']){
                                toInsert['questIds'] = {};
                            }
                            //console.log(toInsert);
                            let questIds = toInsert['questIds']
                            //console.log(toInsert)
                            //console.log(headerName);
                            //console.log(questIds)
                            //console.log(currJSON['Connect Value for Select all that apply questions'])
                            questIds[currJSON['Connect Value for Select all that apply questions']] = {
                                "conceptId" : currJSON['conceptId'],
                                "concept": currJSON["Question Text"]
                            }
                            if(isTB){
                                questIds[currJSON['Connect Value for Select all that apply questions']]['isTextBox'] = true;
                            }
                            if(currJSON['Source Question']){
                                toInsert['conceptId'] = currJSON['Source Question'].substring(0,9);
                                if(!masterJSON[currJSON['Source Question']]){
                                    console.log(currJSON)
                                }
                                
                                toInsert['concept'] = masterJSON[currJSON['Source Question']]['Variable Name'];
                            }
                            
                            toReturn[headerName] = toInsert;
                        }
                        else{
                            for(let k = 0; k < headerName.length; k++){
                                let head = headerName[k];
                                if(toReturn[masterJSON[head]['Quest_Src Question']]){
                                    toInsert = toReturn[masterJSON[head]['Quest_Src Question']];
                                }
                                else{
                                    toInsert = {'questIds':{}}
                                }
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
                                    toInsert['conceptId'] = currJSON['Source Question'][k].substring(0,9);
                                    
                                    toInsert['concept'] = masterJSON[currJSON['Source Question'][k]]['Variable Name'];
                                }
                                //console.log(masterJSON[head])
                                
                                toReturn[masterJSON[head]['Quest_Src Question']] = toInsert;



/*
                                let converted = masterJSON[headerName[i]];
                                if(converted){
                                    toReturn[converted['Variable Name']] = toInsert;
                                }
                                else{
                                    console.log('f;sadlkvbsd;vlksabv')
                                }*/
                            }
                        }
                    }
                }
            }
        }
    }
    /*
    let module1 = fs.readFileSync('./module1Dict.json')
    let module1JSON = JSON.parse(module1);
    let module1Keys = Object.keys(module1JSON);
    for(let i = 0; i < module1Keys.length; i++){
        if(!toReturn[module1Keys[i]]){
            toReturn[module1Keys[i]] = module1JSON[module1Keys[i]]
        }
    }*/
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
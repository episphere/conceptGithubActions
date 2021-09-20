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
            // "898006288.json", "726699695.json"
            //if(currJSON['Secondary Source'] && ["745268907.json","965707586.json","898006288.json", "726699695.json"].includes(currJSON['Secondary Source'])){
            if(currJSON['Secondary Source'] && ["898006288.json", "726699695.json"].includes(currJSON['Secondary Source'])){
                
                if(currJSON['Connect Value for Select all that apply questions']){
                    let isTB = false;
                    let header = currJSON['Connect Value for Select all that apply questions'];
                    let toInsert = {};
                    let headerName = currJSON['Connect Value for Select all that apply questions'];
                    if(currJSON['Connect Value for Select all that apply questions'] == "ECIG3"){
                        //console.log(currJSON)
                        //console.log(headerName)
                    }
                    if(!currJSON['Quest_Src Question']){                    

                        if(currJSON['Connect Value'] && Array.isArray(currJSON['Connect Value'])){
                            isTB = false;
                            let keys = Object.keys(currJSON['Connect Value'])

                            if(toReturn[headerName.toUpperCase()]){
                                toInsert = toReturn[headerName.toUpperCase()];
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
                                questIds[currJSON['Connect Value'][keys[j]].toUpperCase()] = {
                                    "conceptId": keys[j].substring(0,9),
                                    "concept": masterJSON[keys[j]]['Variable Name']?masterJSON[objKeys[k]]['Variable Name']:masterJSON[objKeys[k]]['PII']
                                }
                            }
                            if(currJSON['Connect Value for Select all that apply questions'] === undefined){
                                //console.log(currJSON)
                            }
                            toInsert['questionText'] = currJSON['Question Text']
                            toInsert['conceptId'] = currJSON['conceptId'];
                            toReturn[currJSON['Connect Value for Select all that apply questions'].toUpperCase()] = toInsert;
                            
                        }
                        else{
                            let val = currJSON['Connect Value']
                            if(!val){
                                if(currJSON['Old Quest Value'] == "Don't know"){
                                    isTB = false;
                                    toInsert['questIds'] = {
                                        "77":{
                                            "conceptId":"495230752",
                                            "concept":"Don't know" 
                                        }
                                    }
                                    //console.log(currJSON)
                                    toInsert['questionText'] = currJSON['Question Text']
                                    toInsert['conceptId'] = currJSON['conceptId'];
                                    toReturn[currJSON['Connect Value for Select all that apply questions'].toUpperCase()] = toInsert;
                                }
                                else{
                                    isTB = true;
                                    toInsert['isTextBox'] = isTB;
                                    toInsert['questionText'] = currJSON['Question Text']
                                    toInsert['conceptId'] = currJSON['conceptId'];
                                    toReturn[currJSON['Connect Value for Select all that apply questions'].toUpperCase()] = toInsert;
                                }
                            }
                            else if(typeof val === 'object' && val !== null){
                               let objKeys = Object.keys(val);
                               let qIds = {}
                               for(let k = 0; k < objKeys.length; k++){
                                    qIds[val[objKeys[k]].toUpperCase()] = {
                                        "conceptId":objKeys[k].substring(0,9),
                                        "concept":masterJSON[objKeys[k]]['Variable Name']? masterJSON[objKeys[k]]['Variable Name']: masterJSON[objKeys[k]]['PII']
                                        
                                    }
                                }
                                toInsert['questIds'] = qIds;
                                toInsert['questionText'] = currJSON['Question Text']
                                toInsert['conceptId'] = currJSON['conceptId'];
                                //console.log(currJSON)
                                toReturn[currJSON['Connect Value for Select all that apply questions'].toUpperCase()] = toInsert;
                            }
                            else{
                                if(val.includes('=')){
                                   //console.log(val)
                                   let keyNum = val.split('=')[0].trim();
                                   let valNum = val.split('=')[1].trim();
                                   let thisConcept = '';
                                   if(varNameToConcept[valNum]){
                                       
                                       thisConcept = varNameToConcept[valNum]
                                   }
                                   else{
                                       //console.log(valNum)
                                   }
                                   isTB = false;
                                   if(toReturn[currJSON['Connect Value for Select all that apply questions'].toUpperCase()]){
                                       toInsert = toReturn[headerName.toUpperCase()];
                                    }
                                    if(!toInsert['questIds']){
                                        toInsert['questIds'] = {}
                                    }
                                   //toInsert['questIds'] = {}
                                   toInsert['questIds'][keyNum.toUpperCase()] = {
                                       "conceptId":masterJSON[valNum]?masterJSON[valNum]['conceptId']: thisConcept,
                                       "concept":valNum
                                   }
                                   if(!toInsert['questionText']){
                                       toInsert['questionText'] = currJSON['Question Text']
                                   }
                                   toInsert['conceptId'] = currJSON['conceptId'];
                                   toReturn[currJSON['Connect Value for Select all that apply questions'].toUpperCase()] = toInsert;
                                }
                                else{
                                    isTB = true;
                                    toInsert['isTextBox'] = isTB;
                                    if(!toInsert['questionText']){
                                        toInsert['questionText'] = currJSON['Question Text']
                                    }
                                    toInsert['conceptId'] = currJSON['conceptId'];
                                    toReturn[currJSON['Connect Value for Select all that apply questions'].toUpperCase()] = toInsert;
                                }
                            }
                            
                            
                        }
                        

                    }
                    //check if it is a text response (Connect Value)
                    else{
                        
                        if(currJSON['Connect Value'] && typeof currJSON['Connect Value'] === 'object' && currJSON['Connect Value'] !== null){
                            isTB = false;
                        }
                        else{
                            isTB = true;
                            //console.log(currJSON['Connect Value'])
                        }
                        
                        headerName = currJSON['Quest_Src Question'];
                        if(!Array.isArray(headerName)){
                            if(headerName == currJSON['Connect Value for Select all that apply questions']){
                                //console.log('EQUALS')
                                //console.log(headerName);

                                let val = currJSON['Connect Value']
                                //console.log(val);
                                if(val && typeof val == "string" && val.includes('=')){
                                    //console.log(val)
                                    let keyNum = val.split('=')[0].trim();
                                    let valNum = val.split('=')[1].trim();
                                    let thisConcept = '';
                                    if(varNameToConcept[valNum]){
                                        
                                        thisConcept = varNameToConcept[valNum]
                                    }
                                    else{
                                        //console.log(valNum)
                                    }
                                    isTB = false;
                                    if(toReturn[headerName.toUpperCase()]){
                                        toInsert = toReturn[headerName.toUpperCase()];
                                     }
                                     if(!toInsert['questIds']){
                                         toInsert['questIds'] = {}
                                     }
                                    //toInsert['questIds'] = {}
                                    toInsert['questIds'][keyNum.toUpperCase()] = {
                                        "conceptId":masterJSON[valNum]?masterJSON[valNum]['conceptId']: thisConcept,
                                        "concept":valNum
                                    }
                                    if(!toInsert['Source Question']){
                                        toInsert['questionText'] = masterJSON[currJSON['Source Question']]['Variable Name'];
                                    }
                                    toInsert['conceptId'] = currJSON['Source Question'].substring(0,9);

                                    toReturn[headerName.toUpperCase()] = toInsert;
                                    
                                 }
                                 else if(val && typeof Array.isArray(val)){
                                    let valKeys = Object.keys(val);
                                    for(let k = 0; k < valKeys.length; k++){
                                        let keyNum = val[valKeys[k]];
                                        let valNum = valKeys[k];
                                        isTB = false;
                                    if(toReturn[headerName.toUpperCase()]){
                                        toInsert = toReturn[headerName.toUpperCase()];
                                     }
                                     if(!toInsert['questIds']){
                                         toInsert['questIds'] = {}
                                     }
                                    //toInsert['questIds'] = {}
                                    console.log(masterJSON[valNum])
                                    
                                    toInsert['questIds'][keyNum.toUpperCase()] = {
                                        "conceptId":valNum.substring(0,9),
                                        "concept":masterJSON[valNum]["Variable Name"]
                                    }
                                    if(!toInsert['Source Question']){
                                        toInsert['questionText'] = masterJSON[currJSON['Source Question']]['Variable Name'];
                                    }
                                    toInsert['conceptId'] = currJSON['Source Question'].substring(0,9);

                                    toReturn[headerName.toUpperCase()] = toInsert;
                                    }
                                }
                            }
                            else{
                                //isTB = true;
                                if(toReturn[headerName.toUpperCase()]){
                                    toInsert = toReturn[headerName.toUpperCase()];
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
                                questIds[currJSON['Connect Value for Select all that apply questions'].toUpperCase()] = {
                                    "conceptId" : currJSON['conceptId'],
                                    "concept": currJSON["Question Text"]
                                }
                                if(isTB){
                                    questIds[currJSON['Connect Value for Select all that apply questions'].toUpperCase()]['isTextBox'] = true;
                                }
                                if(currJSON['Source Question']){
                                    toInsert['conceptId'] = currJSON['Source Question'].substring(0,9);
                                    if(!masterJSON[currJSON['Source Question']]){
                                        //console.log(currJSON)
                                    }
                                    
                                    console.log(masterJSON[currJSON['Source Question']])
                                    toInsert['questionText'] = masterJSON[currJSON['Source Question']]['Variable Name'];
                                }
                                
                                toReturn[headerName.toUpperCase()] = toInsert;
                            }
                        }
                        else{
                            for(let k = 0; k < headerName.length; k++){
                                let head = headerName[k];
                                if(toReturn[masterJSON[head]['Quest_Src Question'].toUpperCase()]){
                                    toInsert = toReturn[masterJSON[head]['Quest_Src Question'].toUpperCase()];
                                }
                                else{
                                    toInsert = {'questIds':{}}
                                }
                                let questIds = toInsert['questIds']
    
                                //console.log(questIds)
                                //console.log(currJSON);
                                //console.log(currJSON['Connect Value for Select all that apply questions']);
                                questIds[currJSON['Connect Value for Select all that apply questions'].toUpperCase()] = {
                                    "conceptId" : currJSON['conceptId'],
                                    "concept": currJSON["Question Text"]
                                }
                                if(isTB){
                                    questIds[currJSON['Connect Value for Select all that apply questions'].toUpperCase()]['isTextBox'] = true;
                                }
                                if(currJSON['Source Question']){
                                    toInsert['conceptId'] = currJSON['Source Question'][k].substring(0,9);
                                    
                                    toInsert['questionText'] = masterJSON[currJSON['Source Question'][k]]['Variable Name'];
                                }
                                //console.log(masterJSON[head])
                                
                                toReturn[masterJSON[head]['Quest_Src Question'].toUpperCase()] = toInsert;



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
        if(!toReturn[module1Keys[i].toUpperCase()]){
            toReturn[module1Keys[i].toUpperCase()] = module1JSON[module1Keys[i]]
        }
    }*/
    //console.log(JSON.stringify(toReturn))
    //console.log(toCheckIds)
    /*
    let keys1 = Object.keys(toReturn);
    for(let i = 0; i < keys1.length; i++){
        let currJSON = toReturn[keys1[i].toUpperCase()];
        if(currJSON['questIds']){
            let ids = Object.keys(currJSON['questIds']);
            for(let j = 0; j < ids.length; j++){
                let currId = ids[j];
                if(isNaN(currId)){
                    toReturn[currId.toUpperCase()] = currJSON['questIds'][currId.toUpperCase()];
                    //console.log(currId)
                    //console.log(currJSON['questIds'][currId])
                }
            }
        }
    }*/

    // add a timestamp to filename so filename is in format: testDict-YYYY-MM-DD-hh-mm-ss.json
    let timestamp = new Date().toISOString().split('.')[0].replace(/:/g,'-').replace('T', '-');
    let filename = 'testDict-' + timestamp + '.json';
    // write file
    fs.writeFileSync(filename, JSON.stringify(toReturn,null, 2));    
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

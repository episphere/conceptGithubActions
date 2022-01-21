const fs = require('fs');

function parseMasterModule() {
    let masterJSON = {};
    let fileList = [];
    files = fs.readdirSync('./jsons');
    files.forEach(function (file) {
        if (file.match(/[0-9]{9}.json/) != null) {
            let currJSON = fs.readFileSync('./jsons/' + file, { encoding: 'utf8' });
            masterJSON[file.substring()] = JSON.parse(currJSON);
        }
    });


    let keys = Object.keys(masterJSON);
    let toReturn = {};
    let varNameToConcept = {};
    for (let i = 0; i < keys.length; i++) {
        let currJSON = masterJSON[keys[i]];
        if (currJSON['conceptId'] && currJSON['Question Text']) {
            varNameToConcept[currJSON['Question Text']] = currJSON['conceptId'];
        }
    }

    let toCheckIds = [];
    for (let i = 0; i < keys.length; i++) {

        let currJSON = masterJSON[keys[i]];
        if (currJSON['Primary Source']) {
            if (!Array.isArray(currJSON['Primary Source'])) {
                currJSON['Primary Source'] = [currJSON['Primary Source']];
                if(currJSON['Secondary Source']){
                    currJSON['Secondary Source'] = [currJSON['Secondary Source']];
                }
                if(currJSON['Quest_Src Question']){
                    currJSON['Quest_Src Question'] = [currJSON['Quest_Src Question']];   
                }
                if(currJSON['Source Question']){
                    currJSON['Source Question'] = [currJSON['Source Question']];   
                }
                if(currJSON['Connect Value for Select all that apply questions']){
                    currJSON['Connect Value for Select all that apply questions'] = [currJSON['Connect Value for Select all that apply questions']];   
                }

            }
            
            for (let sourceIndex = 0; sourceIndex < currJSON['Primary Source'].length; sourceIndex++) {

                

                if (currJSON['Primary Source'][sourceIndex] && currJSON['Primary Source'][sourceIndex] === "129084651.json") {
                    //Checks for module name
                    // "898006288.json", "726699695.json"
                    //if(currJSON['Secondary Source'] && ["745268907.json","965707586.json","898006288.json", "726699695.json"].includes(currJSON['Secondary Source'])){
                    //if(currJSON['Secondary Source'] && ["898006288.json", "726699695.json"].includes(currJSON['Secondary Source'])){
                    //if(currJSON['Secondary Source'] && ["640213240.json"].includes(currJSON['Secondary Source'])){
                        
                    if (currJSON['Secondary Source'][sourceIndex] && ["745268907.json","965707586.json","898006288.json", "726699695.json"].includes(currJSON['Secondary Source'][sourceIndex])) {
                        if (currJSON['Connect Value for Select all that apply questions'] && currJSON['Connect Value for Select all that apply questions'][sourceIndex]) {
                            let isTB = false;
                            let header = currJSON['Connect Value for Select all that apply questions'][sourceIndex];
                            let toInsert = {};
                            let headerName = currJSON['Connect Value for Select all that apply questions'][sourceIndex];
                            if (currJSON['Connect Value for Select all that apply questions'][sourceIndex] == "77") {
                                //console.log(currJSON)
                                //console.log(headerName)
                            }
                            
                            if (!currJSON['Quest_Src Question'] || !currJSON['Quest_Src Question'][sourceIndex] || (!Array.isArray(currJSON['Quest_Src Question'][sourceIndex]) && currJSON['Quest_Src Question'][sourceIndex].toLowerCase().includes('grid_'))) {
                                if (currJSON['Quest_Src Question'] && currJSON['Quest_Src Question'][sourceIndex] && currJSON['Quest_Src Question'][sourceIndex].toLowerCase().includes('grid_')) {
                                    if (currJSON['Source Question'] && currJSON['Source Question'][sourceIndex]) {
                                        toReturn[currJSON['Quest_Src Question'][sourceIndex]] = {
                                            'conceptId': currJSON['Source Question'][sourceIndex].substring(0, 9),
                                            'questionText': masterJSON[currJSON['Source Question'][sourceIndex]]['Question Text']
                                        }
                                    }
                                }
                                
                               
                               
                                if (currJSON['Connect Value'] && Array.isArray(currJSON['Connect Value'])) {
                                    isTB = false;
                                    let keys = Object.keys(currJSON['Connect Value'])

                                    if (toReturn[headerName.toUpperCase()]) {
                                        toInsert = toReturn[headerName.toUpperCase()];
                                    }
                                    if (!toInsert['questIds']) {
                                        toInsert = { 'questIds': {} }
                                    }
                                    let questIds = toInsert['questIds']

                                    for (let j = 0; j < keys.length; j++) {
                                        if (!masterJSON[keys[j]]) {
                                            //console.log(keys[j])
                                            //console.log(keys)
                                            //console.log(currJSON)
                                        }
                                        questIds[currJSON['Connect Value'][keys[j]].toUpperCase()] = {
                                            "conceptId": keys[j].substring(0, 9),
                                            "concept": masterJSON[keys[j]]['Question Text'] ? masterJSON[objKeys[k]]['Question Text'] : masterJSON[objKeys[k]]['PII']
                                        }
                                    }
                                    if (currJSON['Connect Value for Select all that apply questions'][sourceIndex] === undefined) {
                                        //console.log(currJSON)
                                    }
                                    toInsert['questionText'] = currJSON['Question Text']
                                    toInsert['conceptId'] = currJSON['conceptId'];
                                    toReturn[currJSON['Connect Value for Select all that apply questions'][sourceIndex].toUpperCase()] = toInsert;

                                }
                                else {
                                    let val = currJSON['Connect Value']
                                    if (!val) {
                                        if (currJSON['Old Quest Value'] == "Don't know") {
                                            isTB = false;
                                            toInsert['questIds'] = {
                                                "77": {
                                                    "conceptId": "495230752",
                                                    "concept": "Don't know"
                                                }
                                            }
                                            toInsert['questionText'] = currJSON['Question Text']
                                            toInsert['conceptId'] = currJSON['conceptId'];
                                            toReturn[currJSON['Connect Value for Select all that apply questions'][sourceIndex].toUpperCase()] = toInsert;
                                        }
                                        else {
                                            isTB = true;
                                            toInsert['isTextBox'] = isTB;
                                            toInsert['questionText'] = currJSON['Question Text']
                                            toInsert['conceptId'] = currJSON['conceptId'];
                                            toReturn[currJSON['Connect Value for Select all that apply questions'][sourceIndex].toUpperCase()] = toInsert;
                                        }
                                        
                                    }
                                    else if (typeof val === 'object' && val !== null) {
                                        let objKeys = Object.keys(val);
                                        let qIds = {}
                                        for (let k = 0; k < objKeys.length; k++) {
                                            qIds[val[objKeys[k]].toUpperCase()] = {
                                                "conceptId": objKeys[k].substring(0, 9),
                                                "concept": masterJSON[objKeys[k]]['Question Text'] ? masterJSON[objKeys[k]]['Question Text'] : masterJSON[objKeys[k]]['PII']

                                            }
                                        }
                                        toInsert['questIds'] = qIds;
                                        toInsert['questionText'] = currJSON['Question Text']
                                        toInsert['conceptId'] = currJSON['conceptId'];
                                        //console.log(currJSON)
                                        toReturn[currJSON['Connect Value for Select all that apply questions'][sourceIndex].toUpperCase()] = toInsert;
                                    }
                                    else {
                                        if (val.includes('=')) {
                                            //console.log(val)
                                            let keyNum = val.split('=')[0].trim();
                                            let valNum = val.split('=')[1].trim();
                                            let thisConcept = '';
                                            if (varNameToConcept[valNum]) {

                                                thisConcept = varNameToConcept[valNum]
                                            }
                                            else {
                                                //console.log(valNum)
                                            }
                                            isTB = false;
                                            if (toReturn[currJSON['Connect Value for Select all that apply questions'][sourceIndex].toUpperCase()]) {
                                                toInsert = toReturn[headerName.toUpperCase()];
                                            }
                                            if (!toInsert['questIds']) {
                                                toInsert['questIds'] = {}
                                            }
                                            //toInsert['questIds'] = {}
                                            toInsert['questIds'][keyNum.toUpperCase()] = {
                                                "conceptId": masterJSON[valNum] ? masterJSON[valNum]['conceptId'] : thisConcept,
                                                "concept": valNum
                                            }
                                            if (!toInsert['questionText']) {
                                                toInsert['questionText'] = currJSON['Question Text']
                                            }
                                            toInsert['conceptId'] = currJSON['conceptId'];
                                            toReturn[currJSON['Connect Value for Select all that apply questions'][sourceIndex].toUpperCase()] = toInsert;
                                        }
                                        else {
                                            isTB = true;
                                            toInsert['isTextBox'] = isTB;
                                            if (!toInsert['questionText']) {
                                                toInsert['questionText'] = currJSON['Question Text']
                                            }
                                            toInsert['conceptId'] = currJSON['conceptId'];
                                            toReturn[currJSON['Connect Value for Select all that apply questions'][sourceIndex].toUpperCase()] = toInsert;
                                        }
                                    }


                                }


                            }
                            //check if it is a text response (Connect Value)
                            else {
                                if (currJSON['Connect Value'] && typeof currJSON['Connect Value'] === 'object' && currJSON['Connect Value'] !== null) {
                                    isTB = false;
                                }
                                else {
                                    isTB = true;
                                    //console.log(currJSON['Connect Value'])
                                }
                                if (currJSON['Connect Value for Select all that apply questions'][sourceIndex] && !isNaN(currJSON['Connect Value for Select all that apply questions'][sourceIndex])) {
                                    //console.log(currJSON['Connect Value for Select all that apply questions'][sourceIndex])
                                    //console.log(headerName)
                                    isTB = false;
                                }

                                headerName = currJSON['Quest_Src Question'][sourceIndex];
                                if (!Array.isArray(headerName)) {

                                    if (headerName == currJSON['Connect Value for Select all that apply questions'][sourceIndex]) {
                                        //console.log('EQUALS')
                                        //console.log(headerName);

                                        let val = currJSON['Connect Value']
                                        //console.log(val);
                                        if (val && typeof val == "string" && val.includes('=')) {
                                            //console.log(val)
                                            let keyNum = val.split('=')[0].trim();
                                            let valNum = val.split('=')[1].trim();
                                            let thisConcept = '';
                                            if (varNameToConcept[valNum]) {

                                                thisConcept = varNameToConcept[valNum]
                                            }
                                            else {
                                                //console.log(valNum)
                                            }
                                            isTB = false;
                                            if (toReturn[headerName.toUpperCase()]) {
                                                toInsert = toReturn[headerName.toUpperCase()];
                                            }
                                            if (!toInsert['questIds']) {
                                                toInsert['questIds'] = {}
                                            }
                                            //toInsert['questIds'] = {}
                                            toInsert['questIds'][keyNum.toUpperCase()] = {
                                                "conceptId": masterJSON[valNum] ? masterJSON[valNum]['conceptId'] : thisConcept,
                                                "concept": valNum
                                            }
                                            if (!toInsert['Source Question']) {
                                                toInsert['questionText'] = masterJSON[currJSON['Source Question'][sourceIndex]]['Question Text'];
                                            }
                                            toInsert['conceptId'] = currJSON['Source Question'][sourceIndex].substring(0, 9);

                                            toReturn[headerName.toUpperCase()] = toInsert;

                                        }
                                        else if (val && typeof Array.isArray(val)) {
                                            let valKeys = Object.keys(val);
                                            for (let k = 0; k < valKeys.length; k++) {
                                                let keyNum = val[valKeys[k]];
                                                let valNum = valKeys[k];
                                                isTB = false;
                                                if (toReturn[headerName.toUpperCase()]) {
                                                    toInsert = toReturn[headerName.toUpperCase()];
                                                }
                                                if (!toInsert['questIds']) {
                                                    toInsert['questIds'] = {}
                                                }
                                                //toInsert['questIds'] = {}
                                                //console.log(masterJSON[valNum])

                                                toInsert['questIds'][keyNum.toUpperCase()] = {
                                                    "conceptId": valNum.substring(0, 9),
                                                    "concept": masterJSON[valNum]["Question Text"]
                                                }
                                                if (!toInsert['Source Question']) {
                                                    toInsert['questionText'] = masterJSON[currJSON['Source Question'][sourceIndex]]['Question Text'];
                                                }
                                                toInsert['conceptId'] = currJSON['Source Question'][sourceIndex].substring(0, 9);

                                                toReturn[headerName.toUpperCase()] = toInsert;
                                            }
                                        }
                                    }
                                    else {
                                        //isTB = true;
                                        if (toReturn[headerName.toUpperCase()]) {
                                            toInsert = toReturn[headerName.toUpperCase()];
                                        }
                                        else {
                                            toInsert = { 'questIds': {} }
                                        }
                                        if (!toInsert['questIds']) {
                                            toInsert['questIds'] = {};
                                        }
                                        //console.log(toInsert);
                                        let questIds = toInsert['questIds']
                                        //console.log(toInsert)
                                        //console.log(headerName);
                                        //console.log(questIds)
                                        //console.log(currJSON['Connect Value for Select all that apply questions'])
                                        questIds[currJSON['Connect Value for Select all that apply questions'][sourceIndex].toUpperCase()] = {
                                            "conceptId": currJSON['conceptId'],
                                            "concept": currJSON["Question Text"]
                                        }
                                        if (isTB) {
                                           
                                            questIds[currJSON['Connect Value for Select all that apply questions'][sourceIndex].toUpperCase()]['isTextBox'] = isTB;
                                        }
                                        if (currJSON['Source Question'] && currJSON['Source Question'][sourceIndex]) {
                                            toInsert['conceptId'] = currJSON['Source Question'][sourceIndex].substring(0, 9);
                                            if (!masterJSON[currJSON['Source Question'][sourceIndex]]) {
                                                //console.log(currJSON)
                                            }

                                            toInsert['questionText'] = masterJSON[currJSON['Source Question'][sourceIndex]]['Question Text'];
                                        }

                                        toReturn[headerName.toUpperCase()] = toInsert;
                                    }
                                }
                                else {
                                    
                                    for (let k = 0; k < headerName.length; k++) {
                                        let head = headerName[k];
                                        //console.log(currJSON)
                                        //console.log(masterJSON[head])
                                        if(currJSON['conceptId'] == 283652434){
                                        console.log('efg')
                                        console.log(masterJSON[head])
                                    }
                                        if (toReturn[masterJSON[head]['Quest_Src Question'].toUpperCase()]) {
                                            toInsert = toReturn[masterJSON[head]['Quest_Src Question'].toUpperCase()];
                                        }
                                        else {
                                            toInsert = { 'questIds': {} }
                                        }
                                        let questIds = toInsert['questIds']

                                        //console.log(questIds)
                                        //console.log(currJSON);
                                        //console.log(currJSON['Connect Value for Select all that apply questions']);
                                        questIds[currJSON['Connect Value for Select all that apply questions'][sourceIndex].toUpperCase()] = {
                                            "conceptId": currJSON['conceptId'],
                                            "concept": currJSON["Question Text"]
                                        }
                                        if (isTB) {
                                            questIds[currJSON['Connect Value for Select all that apply questions'][sourceIndex].toUpperCase()]['isTextBox'] = true;
                                        }
                                        if (currJSON['Source Question'] && currJSON['Source Question'][sourceIndex]) {
                                            toInsert['conceptId'] = currJSON['Source Question'][sourceIndex][k].substring(0, 9);

                                            toInsert['questionText'] = masterJSON[currJSON['Source Question'][sourceIndex][k]]['Question Text'];
                                        }
                                        //console.log(masterJSON[head])

                                        toReturn[masterJSON[head]['Quest_Src Question'].toUpperCase()] = toInsert;



                                        /*
                                                                        let converted = masterJSON[headerName[i]];
                                                                        if(converted){
                                                                            toReturn[converted['Question Text']] = toInsert;
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
    let timestamp = new Date().toISOString().split('.')[0].replace(/:/g, '-').replace('T', '-');
    let filename = 'Quest-' + timestamp + '_Transformation.json';
    // write file
    fs.writeFileSync(filename, JSON.stringify(toReturn, null, 2));
    fs.writeFileSync('testDict.json', JSON.stringify(toReturn, null, 2));
    //fs.writeFileSync('toCheckIDs.json', JSON.stringify(toCheckIds,null, 2));

    const ordered = Object.keys(toReturn).sort().reduce(
        (obj, key) => { 
        obj[key] = unordered[key]; 
        return obj;
        }, 
        {}
    );
    let filename2 = 'Quest-' + timestamp + '_Alphabetized_Transformation.json';
    fs.writeFileSync(filename2, JSON.stringify(ordered, null, 2));


    //console.log(JSON.stringify(toReturn));

    /*
    if(changed){
        aggregate.aggregate();
    }*/
}
module.exports = {
    parseMasterModule: parseMasterModule
}
parseMasterModule();

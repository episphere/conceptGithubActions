const fs = require('fs');

/**
 * checks string if it contains any of the prefix matches ("grid_", "nest_")
 * @param {string} text
 * @returns {boolean}
*/
function isGridIdSourceQuestionNamePrefixMatch (text) {
    // Add grid and future custom prefix here for reference
    const prefixMatches = ["grid_","nest_"]
    const isMatch = prefixMatches.some(match => text.toLowerCase().includes(match))
    return isMatch
}

/**
 * isValidSrcHeader
 * @params {string} sourceGridId - GridID/Source Question Name
 * @params {boolean} isTB - isTextBox
 * @params {object} currJSONFormatValue - Current Format/Value
 * Checks for old src format from GridID/Source Question Name (Ex. SrvCov_COV3SRC_v3r0)
 * Checks for new src format from GridID/Source Question Name (Ex. grid_COV3_SRC_v3r0)
 * @returns {boolean}
*/
function isValidSourceGridFormat (sourceGridId, isTB, currJSONFormatValue) {
    sourceGridId = sourceGridId.toUpperCase();

    if (sourceGridId && sourceGridId.split('_').length === 3 
        && sourceGridId.split('_')[1].slice(-3).toUpperCase() === "SRC"
        && isTB === false && currJSONFormatValue 
        && typeof currJSONFormatValue === 'object') {
            return true;
        } else if (
            sourceGridId && sourceGridId.split('_').includes("SRC")
            && isTB === false && currJSONFormatValue
            && typeof currJSONFormatValue === 'object') {
                return true;
        } 
    return false;
}

function parseMasterModule() {
    let masterJSON = {};
    let fileList = [];
    files = fs.readdirSync('./jsons/');
     // loop through all files in the jsons folder. (Ex. { 123456789.json: {json content}, ... })
    files.forEach(function (file) {
        if (file.match(/[0-9]{9}.json/) != null) {
            let currJSON = fs.readFileSync('./jsons/' + file, { encoding: 'utf8' });
            masterJSON[file.substring()] = JSON.parse(currJSON);
        }
    });
    console.log("masterJSON", masterJSON);

    let keys = Object.keys(masterJSON); // Ex. ["113838601.json", "126388230.json", ...]
    let toReturn = {}; // Becomes the JSON transformation
    let varNameToConcept = {}; // current question text to concept id
    for (let i = 0; i < keys.length; i++) {
        let currJSON = masterJSON[keys[i]];
        if (currJSON['conceptId'] && currJSON['Current Question Text']) {
            varNameToConcept[currJSON['Current Question Text']] = currJSON['conceptId'];
        }
    }


    let toCheckIds = [];
    // add new secondary source concept Ids here 
    const secondarySourceCids = ["745268907.json","965707586.json","898006288.json", "726699695.json", "716117817.json", "131497719.json", "232438133.json", "299215535.json", "166676176.json", "826163434.json" ,"506648060.json", "110511396.json","793330426.json", "390351864.json", "369168474.json", "601305072.json", "912367929.json", "285882990.json"]

    // let numString = 0 // Test for Deprecated filter
    // let stringCids = [] //Test for Deprecated filter
    for (let i = 0; i < keys.length; i++) {

        let currJSON = masterJSON[keys[i]];
        // skip to "126388230" for testing
        if (currJSON['Primary Source']) { // check if primary source exists, skips to next iteration if not
            if (!Array.isArray(currJSON['Primary Source'])) { // Standardize property values to arrays
                currJSON['Primary Source'] = [currJSON['Primary Source']];
                if(currJSON['Secondary Source']){
                    currJSON['Secondary Source'] = [currJSON['Secondary Source']];
                }
                if(currJSON['GridID/Source Question Name']){
                    currJSON['GridID/Source Question Name'] = [currJSON['GridID/Source Question Name']];   
                }
                if(currJSON['Current Source Question']){
                    currJSON['Current Source Question'] = [currJSON['Current Source Question']];   
                }
                if(currJSON['Connect Value for Select all that apply questions - Surveys Only']){
                    currJSON['Connect Value for Select all that apply questions - Surveys Only'] = [currJSON['Connect Value for Select all that apply questions - Surveys Only']];   
                } 
            }

            for (let sourceIndex = 0; sourceIndex < currJSON['Primary Source'].length; sourceIndex++) { // iterate through currJOSNS array of primary sources
                
                if (currJSON['Primary Source'][sourceIndex] && currJSON['Primary Source'][sourceIndex] === "129084651.json") { // logic to check if primary source is a SURVEY

                    // Checks for module name in secondary source    
                    if (currJSON['Secondary Source'][sourceIndex] && secondarySourceCids.includes(currJSON['Secondary Source'][sourceIndex])) { // checks if secondary source exists from array
                        
                            if (currJSON['Connect Value for Select all that apply questions - Surveys Only'] 
                                && currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex]) {
                                // isTB - isTextBox
                                let isTB = false;
                                let header = currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex];
                                let toInsert = {};
                                let headerName = currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex];
                                if (currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex] == "77") {
                                    //console.log(currJSON)
                                    //console.log(headerName)
                                }
                                
                                if (!currJSON['GridID/Source Question Name'] 
                                    || !currJSON['GridID/Source Question Name'][sourceIndex] 
                                    || (!Array.isArray(currJSON['GridID/Source Question Name'][sourceIndex]) 
                                    && isGridIdSourceQuestionNamePrefixMatch(currJSON['GridID/Source Question Name'][sourceIndex]))) { // Match for case insensitive "grid_" or "nest_" prefix
                                        
                                    if (currJSON['GridID/Source Question Name'] && currJSON['GridID/Source Question Name'][sourceIndex] && isGridIdSourceQuestionNamePrefixMatch(currJSON['GridID/Source Question Name'][sourceIndex])) {
                                        
                                        if (currJSON['Current Source Question'] && currJSON['Current Source Question'][sourceIndex]) {
                                            toReturn[currJSON['GridID/Source Question Name'][sourceIndex]] = {
                                                'conceptId': currJSON['Current Source Question'][sourceIndex].substring(0, 9),
                                                'questionText': masterJSON[currJSON['Current Source Question'][sourceIndex]]['Current Question Text']
                                            }
                                        }
                                    }
                                    
                                    if (currJSON['Current Format/Value'] && Array.isArray(currJSON['Current Format/Value'])) {
                                        isTB = false;
                                        let keys = Object.keys(currJSON['Current Format/Value'])
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
                                            questIds[currJSON['Current Format/Value'][keys[j]].toUpperCase()] = {
                                                "conceptId": keys[j].substring(0, 9),
                                                "concept": masterJSON[keys[j]]['Current Question Text'] ? masterJSON[objKeys[k]]['Current Question Text'] : masterJSON[objKeys[k]]['PII']
                                            }
                                        }
                                        if (currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex] === undefined) {
                                            //console.log(currJSON)
                                        }
                                        toInsert['questionText'] = currJSON['Current Question Text']
                                        toInsert['conceptId'] = currJSON['conceptId'];
                                        toReturn[currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase()] = toInsert;
    
                                    }
                                    else {
                                        if(currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase().includes('ALCLIFE4')){
                                            console.log(currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase())
                                        }
                                        
                                        let val = currJSON['Current Format/Value']
                                        if (!val) {
                                            if (currJSON['Old Quest Value'] == "Don't know") {
                                                isTB = false;
                                                toInsert['questIds'] = {
                                                    "77": {
                                                        "conceptId": "495230752",
                                                        "concept": "Don't know"
                                                    }
                                                }
                                                toInsert['questionText'] = currJSON['Current Question Text']
                                                toInsert['conceptId'] = currJSON['conceptId'];
                                                toReturn[currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase()] = toInsert;
                                            }
                                            else {
                                                if(currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase().includes('GRID_')){
                                                    toInsert['questionText'] = currJSON['Current Question Text']
                                                    toInsert['conceptId'] = currJSON['conceptId'];
                                                    toReturn[currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase()] = toInsert;
                                                }
                                                else{
                                                    isTB = true;
                                                    toInsert['isTextBox'] = isTB;
                                                    toInsert['questionText'] = currJSON['Current Question Text']
                                                    toInsert['conceptId'] = currJSON['conceptId'];
                                                    toReturn[currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase()] = toInsert;
                                                }
                                                
                                            }
                                            
                                        }
                                        else if (typeof val === 'object' && val !== null) {
    
                                            if (currJSON['GridID/Source Question Name'] && currJSON['GridID/Source Question Name'][sourceIndex] && currJSON['GridID/Source Question Name'][sourceIndex].toLowerCase().includes('grid_') && val['104430631.json'] && val['353358909.json']) {
                                                console.log(currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase())
                                                let currName = currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase()
                                                if(currName.includes('_')){
                                                    let name = currName.substring(0, currName.indexOf('_'))
                                                    let id = currName.substring(currName.indexOf('_') + 1)
                                                    if(!toReturn[name]){
                                                        toReturn[name] = {}
                                                    }
                                                    toReturn[name][id] = {
                                                        'questionText':currJSON['Current Question Text'],
                                                        'conceptId':currJSON['conceptId'].substring(0, 9)
                                                    }
                                                    // console.log(currJSON)
                                                    toReturn[name]['conceptId'] = currJSON['Current Source Question'][sourceIndex].substring(0, 9)
                                                    toReturn[name]['concept'] = masterJSON[currJSON['Current Source Question'][sourceIndex]]['Current Question Text']
                                                }
                                            }
                                            else{
                                                let objKeys = Object.keys(val);
                                                let qIds = {}
                                                for (let k = 0; k < objKeys.length; k++) {
                                                    qIds[val[objKeys[k]].toUpperCase()] = {
                                                        "conceptId": objKeys[k].substring(0, 9),
                                                        "concept": masterJSON[objKeys[k]]['Current Question Text'] ? masterJSON[objKeys[k]]['Current Question Text'] : masterJSON[objKeys[k]]['PII']
    
                                                    }
                                                }
                                                toInsert['questIds'] = qIds;
                                                toInsert['questionText'] = currJSON['Current Question Text']
                                                toInsert['conceptId'] = currJSON['conceptId'];
                                                //console.log(currJSON)
                                                toReturn[currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase()] = toInsert;
                                            }
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
                                                if (toReturn[currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase()]) {
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
                                                    toInsert['questionText'] = currJSON['Current Question Text']
                                                }
                                                toInsert['conceptId'] = currJSON['conceptId'];
                                                toReturn[currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase()] = toInsert;
                                            }
                                            else {
                                                isTB = true;
                                                toInsert['isTextBox'] = isTB;
                                                if (!toInsert['questionText']) {
                                                    toInsert['questionText'] = currJSON['Current Question Text']
                                                }
                                                toInsert['conceptId'] = currJSON['conceptId'];
                                                toReturn[currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase()] = toInsert;
                                            }
                                        }
    
    
                                    }
    
    
                                }
                                //check if it is a text response (Connect Value)*
                                else {
                                    // console.log("keys",keys)
                                    if (currJSON['Current Format/Value'] && typeof currJSON['Current Format/Value'] === 'object' && currJSON['Current Format/Value'] !== null) { // determines TextBox, repsonses are object
                                        isTB = false;
                                    }
                                    else {
                                        isTB = true;
                                        //console.log(currJSON['Current Format/Value'])
                                    }
                                    if (currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex] && !isNaN(currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex])) { // number val condition
                                        //console.log(currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex])
                                        //console.log(headerName)
                                        isTB = false;
                                    }
    
                                    headerName = currJSON['GridID/Source Question Name'][sourceIndex]; // Reassignment from Connect Value to GridID/Source Question Name, [possible area to add logic ]*
                                    if (!Array.isArray(headerName)) { // if not an array*
    
                                        if (headerName == currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex]) { // if the header name is the same as the variable name ~SOURCE OF THE PROBLEM~
                                            //console.log('EQUALS')
                                            //console.log(headerName);
    
                                            let val = currJSON['Current Format/Value'] // adding is here
                                            //console.log(val);
                                            if (val && typeof val == "string" && val.includes('=')) {
                                                // console.log("EQUALS VALUE WITH MATCHING GRID ID AND CONNECT VALUE")
                                                // console.log(val)
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
                                                if (!toInsert['Current Source Question']) {
                                                    toInsert['questionText'] = masterJSON[currJSON['Current Source Question'][sourceIndex]]['Current Question Text'];
                                                }
                                                toInsert['conceptId'] = currJSON['Current Source Question'][sourceIndex].substring(0, 9);
    
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
                                                    // console.log(masterJSON[valNum])
    
                                                    toInsert['questIds'][keyNum.toUpperCase()] = {
                                                        "conceptId": valNum.substring(0, 9),
                                                        "concept": masterJSON[valNum]["Current Question Text"]
                                                    }
                                                    if (!toInsert['Current Source Question']) {
                                                        toInsert['questionText'] = masterJSON[currJSON['Current Source Question'][sourceIndex]]['Current Question Text'];
                                                    }
                                                    toInsert['conceptId'] = currJSON['Current Source Question'][sourceIndex].substring(0, 9);
    
                                                    toReturn[headerName.toUpperCase()] = toInsert;
                                                }
                                            }
                                        }
                                        else {
                                            //isTB = true; // Delete this line
                                            if (toReturn[headerName.toUpperCase()]) { // header name exists already, add to existing header
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
                                            //console.log(currJSON['Connect Value for Select all that apply questions - Surveys Only'])
                                            // console.log(currJSON)
                                            questIds[currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase()] = { // insert connect value
                                                "conceptId": currJSON['conceptId'],
                                                "concept": currJSON["Current Question Text"]
                                            }
                                            if (isTB) {

                                                questIds[currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase()]['isTextBox'] = isTB;
                                            }
                                            // TODO: REFACTOR INTO A FUNCTION
                                            if (currJSON['Current Source Question'] && currJSON['Current Source Question'][sourceIndex]) {
                                                toInsert['conceptId'] = currJSON['Current Source Question'][sourceIndex].substring(0, 9); // questionText level cid reassigned to source questoion cid
                                                if (!masterJSON[currJSON['Current Source Question'][sourceIndex]]) {
                                                    //console.log(currJSON)
                                                }
                                                // condition for SRC GRIDID/Source Question Name 
                                                const sourceGridId = headerName // GridID/Source Question Name
                                                const currJSONFormatValue = currJSON['Current Format/Value']
                                                const hasSourceGridFormat = isValidSourceGridFormat(sourceGridId, isTB, currJSONFormatValue)
                                                console.log("🚀 ~ parseMasterModule ~ hasSourceGridFormat:", hasSourceGridFormat)
                                                if (hasSourceGridFormat) {
                                                    // get all the current Format/Value numbers
                                                    const currJSONFormatValueArrayOfKeys = Object.keys(currJSON['Current Format/Value']) // ["104430631.json", "353358909.json"]
                                                    // get value of keys
                                                    // loop through keys
                                                    
                                                    for (const currJSONKey of currJSONFormatValueArrayOfKeys) { 
                                                        questIds[currJSON['Current Format/Value'][currJSONKey]] = { // grabs the value of the key
                                                            "conceptId": currJSONKey.substring(0, 9), // grabs the key and slices it to 9 remove .json
                                                            "concept": masterJSON[currJSONKey]['Current Question Text'] 
                                                        }
                                                    }
                                                }
                                                toInsert['questionText'] = masterJSON[currJSON['Current Source Question'][sourceIndex]]['Current Question Text'];
                                            }
    
                                            toReturn[headerName.toUpperCase()] = toInsert;
                                        }
                                    }
                                    else {
                                        
                                        for (let k = 0; k < headerName.length; k++) {
                                            let head = headerName[k];
                                            //console.log(currJSON)
                                            //console.log(masterJSON[head])
                                            if(currJSON['conceptId'] == 283652434){ // ignore*
                                                console.log('efg')
                                                console.log(masterJSON[head])
                                            }
                                            //console.log(toReturn)
                                            if (toReturn[head.toUpperCase()]) {
                                                toInsert = toReturn[head.toUpperCase()];
                                            }
                                            else {
                                                toInsert = { 'questIds': {} }
                                            }
                                            let questIds = toInsert['questIds']
    
                                            //console.log(questIds)
                                            //console.log(currJSON);
                                            //console.log(currJSON['Connect Value for Select all that apply questions - Surveys Only']);
                                            questIds[currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase()] = {
                                                "conceptId": currJSON['conceptId'],
                                                "concept": currJSON["Current Question Text"]
                                            }
                                            if (isTB) {
                                                questIds[currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase()]['isTextBox'] = true;
                                            }
                                            if (currJSON['Current Source Question'] && currJSON['Current Source Question'][sourceIndex]) {
                                                toInsert['conceptId'] = currJSON['Current Source Question'][sourceIndex][k].substring(0, 9);
    
                                                toInsert['questionText'] = masterJSON[currJSON['Current Source Question'][sourceIndex][k]]['Current Question Text'];
                                            }
                                            //console.log(masterJSON[head])
    
                                            toReturn[head.toUpperCase()] = toInsert;
    
    
    
                                            /*
                                                                            let converted = masterJSON[headerName[i]];
                                                                            if(converted){
                                                                                toReturn[converted['Current Question Text']] = toInsert;
                                                                            }
                                                                            else{
                                                                                console.log('f;sadlkvbsd;vlksabv')
                                                                            }*/
                                        }
                                    }
                                }
                            }
                            else if (currJSON['Variable Name'] && currJSON['Variable Name'][sourceIndex]) { // Above If ("Connect Value for Select all that apply questions - Surveys Only") exists ,variable Name usage 
                              let isTB = false;
                              let header = currJSON['Variable Name'][sourceIndex];
                              let toInsert = {};
                              let headerName = currJSON['Variable Name'][sourceIndex];
                              if (currJSON['Variable Name'][sourceIndex] == "77") {
                                  //console.log(currJSON)
                                  //console.log(headerName)
                              }
                              
                              // Last check is grid_ or nest_ prefix match
                              if (!currJSON['GridID/Source Question Name'] 
                                || !currJSON['GridID/Source Question Name'][sourceIndex] 
                                || (!Array.isArray(currJSON['GridID/Source Question Name'][sourceIndex]) 
                                && isGridIdSourceQuestionNamePrefixMatch(currJSON['GridID/Source Question Name'][sourceIndex]))) {

                                  if (currJSON['GridID/Source Question Name'] 
                                    && currJSON['GridID/Source Question Name'][sourceIndex] 
                                    && isGridIdSourceQuestionNamePrefixMatch(currJSON['GridID/Source Question Name'][sourceIndex])) {
                                      
                                      if (currJSON['Current Source Question'] && currJSON['Current Source Question'][sourceIndex]) {
                                          toReturn[currJSON['GridID/Source Question Name'][sourceIndex]] = {
                                              'conceptId': currJSON['Current Source Question'][sourceIndex].substring(0, 9),
                                              'questionText': masterJSON[currJSON['Current Source Question'][sourceIndex]]['Current Question Text']
                                          }
                                      }
    
                                      
                                  }
                                  
                                 
                                 
                                  if (currJSON['Current Format/Value'] && Array.isArray(currJSON['Current Format/Value'])) {
                                      isTB = false;
                                      let keys = Object.keys(currJSON['Current Format/Value'])
    
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
                                          questIds[currJSON['Current Format/Value'][keys[j]].toUpperCase()] = {
                                              "conceptId": keys[j].substring(0, 9),
                                              "concept": masterJSON[keys[j]]['Current Question Text'] ? masterJSON[objKeys[k]]['Current Question Text'] : masterJSON[objKeys[k]]['PII']
                                          }
                                      }
                                      if (currJSON['Variable Name'][sourceIndex] === undefined) {
                                          //console.log(currJSON)
                                      }
                                      toInsert['questionText'] = currJSON['Current Question Text']
                                      toInsert['conceptId'] = currJSON['conceptId'];
                                      toReturn[currJSON['Variable Name'][sourceIndex].toUpperCase()] = toInsert;
    
                                  }
                                    else {
                                        if(currJSON['Variable Name'][sourceIndex].toUpperCase().includes('ALCLIFE4')){
                                            console.log(currJSON['Variable Name'][sourceIndex].toUpperCase())
                                        }
                                        
                                        let val = currJSON['Current Format/Value']
                                        if (!val) {
                                            if (currJSON['Old Quest Value'] == "Don't know") {
                                                isTB = false;
                                                toInsert['questIds'] = {
                                                    "77": {
                                                        "conceptId": "495230752",
                                                        "concept": "Don't know"
                                                    }
                                                }
                                                toInsert['questionText'] = currJSON['Current Question Text']
                                                toInsert['conceptId'] = currJSON['conceptId'];
                                                toReturn[currJSON['Variable Name'][sourceIndex].toUpperCase()] = toInsert;
                                          } else { //?
                                                if (currJSON['Variable Name'][sourceIndex].toUpperCase().includes('GRID_')){
                                                    toInsert['questionText'] = currJSON['Current Question Text']
                                                    toInsert['conceptId'] = currJSON['conceptId'];
                                                    toReturn[currJSON['Variable Name'][sourceIndex].toUpperCase()] = toInsert;
                                                } else {
                                                    isTB = true;
                                                    toInsert['isTextBox'] = isTB;
                                                    toInsert['questionText'] = currJSON['Current Question Text']
                                                    toInsert['conceptId'] = currJSON['conceptId'];
                                                    toReturn[currJSON['Variable Name'][sourceIndex].toUpperCase()] = toInsert;
                                                }
                                            }
                                        }
                                        else if (typeof val === 'object' && val !== null) {
    
                                          if (currJSON['GridID/Source Question Name'] 
                                            && currJSON['GridID/Source Question Name'][sourceIndex] 
                                            && currJSON['GridID/Source Question Name'][sourceIndex].toLowerCase().includes('grid_') 
                                            && val['104430631.json'] && val['353358909.json']) {
                                              // console.log(currJSON['Variable Name'][sourceIndex].toUpperCase())
                                              let currName = currJSON['Variable Name'][sourceIndex].toUpperCase()
                                              // if(currName.includes('_')){
                                              //   console.log("This is '_' currName condition",currName)
                                              //     let name = currName.substring(0, currName.indexOf('_'))
                                              //     let id = currName.substring(currName.indexOf('_') + 1)
                                              //     if(!toReturn[name]){
                                              //         toReturn[name] = {}
                                              //     }
                                              //     toReturn[name][id] = {
                                              //         'questionText':currJSON['Current Question Text'],
                                              //         'conceptId':currJSON['conceptId'].substring(0, 9)
                                              //     }
                                              //     // console.log(currJSON)
                                              //     toReturn[name]['conceptId'] = currJSON['Current Source Question'][sourceIndex].substring(0, 9)
                                              //     toReturn[name]['concept'] = masterJSON[currJSON['Current Source Question'][sourceIndex]]['Current Question Text']
                                              // }
                                          }
                                          else {
                                              let objKeys = Object.keys(val);
                                              let qIds = {}
                                              for (let k = 0; k < objKeys.length; k++) {
                                                  qIds[val[objKeys[k]].toUpperCase()] = {
                                                      "conceptId": objKeys[k].substring(0, 9),
                                                      "concept": masterJSON[objKeys[k]]['Current Question Text'] ? masterJSON[objKeys[k]]['Current Question Text'] : masterJSON[objKeys[k]]['PII']
    
                                                  }
                                              }
                                              toInsert['questIds'] = qIds;
                                              toInsert['questionText'] = currJSON['Current Question Text']
                                              toInsert['conceptId'] = currJSON['conceptId'];
                                              //console.log(currJSON)
                                              toReturn[currJSON['Variable Name'][sourceIndex].toUpperCase()] = toInsert;
                                          }
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
                                              if (toReturn[currJSON['Variable Name'][sourceIndex].toUpperCase()]) {
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
                                                  toInsert['questionText'] = currJSON['Current Question Text']
                                              }
                                              toInsert['conceptId'] = currJSON['conceptId'];
                                              toReturn[currJSON['Variable Name'][sourceIndex].toUpperCase()] = toInsert;
                                          }
                                          else {
                                              isTB = true;
                                              toInsert['isTextBox'] = isTB;
                                              if (!toInsert['questionText']) {
                                                  toInsert['questionText'] = currJSON['Current Question Text']
                                              }
                                              toInsert['conceptId'] = currJSON['conceptId'];
                                              toReturn[currJSON['Variable Name'][sourceIndex].toUpperCase()] = toInsert;
                                          }
                                      }
    
    
                                  }
    
    
                              }
                              //check if it is a text response (Connect Value)
                              else {
                                if (currJSON['conceptId'] === "498397716") {
                                    console.log("------------------")
                                    console.log("currJSON['Current Format/Value']", currJSON['Current Format/Value'])
                                    console.log("typeof currJSON['Current Format/Value'] === 'object'", typeof currJSON['Current Format/Value'] === 'object')
                                    console.log("currJSON['Current Format/Value'] !== null", currJSON['Current Format/Value'] !== null)

                                }
                                if (currJSON['Current Format/Value'] 
                                    && typeof currJSON['Current Format/Value'] === 'object' 
                                    && currJSON['Current Format/Value'] !== null) {
                                      isTB = false;
                                } else {
                                      isTB = true;
                                      //console.log(currJSON['Current Format/Value'])
                                }
                                if (currJSON['Variable Name'][sourceIndex] && !isNaN(currJSON['Variable Name'][sourceIndex])) {
                                      //console.log(currJSON['Variable Name'][sourceIndex])
                                      //console.log(headerName)
                                    isTB = false;
                                }
    
                                headerName = currJSON['GridID/Source Question Name'][sourceIndex]; // becomes one of the top level variable names in JSON
                                if (!Array.isArray(headerName)) { // current GRIDID/Source Question Name is not an array
    
                                    if (headerName == currJSON['Variable Name'][sourceIndex]) { // if the GRIDID/Source Question Name is the SAME as the variable name 
                                        //console.log('EQUALS')
                                        //console.log(headerName);

                                        let val = currJSON['Current Format/Value']
                                        console.log("🚀 ~ parseMasterModule ~ val:", val)
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
                                            if (!toInsert['Current Source Question']) { // CHANGE HERE
                                                toInsert['questionText'] = masterJSON[currJSON['Current Source Question'][sourceIndex]]['Current Question Text'];
                                            }
                                            toInsert['conceptId'] = currJSON['Current Source Question'][sourceIndex].substring(0, 9);

                                            toReturn[headerName.toUpperCase()] = toInsert;

                                        }
                                        else if (val && typeof Array.isArray(val)) { // 'Current Format/Value'
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
                                                    "concept": masterJSON[valNum]["Current Question Text"]
                                                }
                                                if (!toInsert['Current Source Question']) {
                                                    toInsert['questionText'] = masterJSON[currJSON['Current Source Question'][sourceIndex]]['Current Question Text'];
                                                }
                                                toInsert['conceptId'] = currJSON['Current Source Question'][sourceIndex].substring(0, 9);

                                                toReturn[headerName.toUpperCase()] = toInsert;
                                            }
                                        }
                                    }
                                    else { // "GridID/Source Question Name" !== "Variable Name" (No Match)
                                    //   isTB = true;
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
                                        //console.log(currJSON['Variable Name'])
                                        // console.log(currJSON)

                                        questIds[currJSON['Variable Name'][sourceIndex].toUpperCase()] = {
                                            "conceptId": currJSON['conceptId'],
                                            "concept": currJSON["Current Question Text"]
                                        }
                                        if (isTB) {
                                            questIds[currJSON['Variable Name'][sourceIndex].toUpperCase()]['isTextBox'] = isTB;
                                        }

                                        // TODO: REFACTOR INTO A FUNCTION
                                        if (currJSON['Current Source Question'] && currJSON['Current Source Question'][sourceIndex]) { // Adds 'Current Source Question' value "conceptid#.json"
                                            toInsert['conceptId'] = currJSON['Current Source Question'][sourceIndex].substring(0, 9);
                                            if (!masterJSON[currJSON['Current Source Question'][sourceIndex]]) {
                                                //console.log(currJSON)
                                            }
                                            // condition for SRC GRIDID/Source Question Name 
                                            const sourceGridId = headerName // GridID/Source Question Name
                                            const hasSourceGridFormat = isValidSourceGridFormat(sourceGridId)
                                            console.log("🚀 ~ parseMasterModule ~ hasSourceGridFormat:", hasSourceGridFormat)
                                            if (hasSourceGridFormat) {
                                                // get all the current Format/Value numbers
                                                const currJSONFormatValueArrayOfKeys = Object.keys(currJSON['Current Format/Value']) // ["104430631.json", "353358909.json"]
                                                // get value of keys
                                                // loop through keys
                                                
                                                for (const currJSONKey of currJSONFormatValueArrayOfKeys) { 
                                                    questIds[currJSON['Current Format/Value'][currJSONKey]] = { // grabs the value of the key
                                                        "conceptId": currJSONKey.substring(0, 9), // grabs the key and slices it to 9 remove .json
                                                        "concept": masterJSON[currJSONKey]['Current Question Text'] 
                                                    }
                                                }
                                            }
                                            toInsert['questionText'] = masterJSON[currJSON['Current Source Question'][sourceIndex]]['Current Question Text'];
                                        }
                                        toReturn[headerName.toUpperCase()] = toInsert;
                                    }
                                }
                                  else { // headerName (GridID/Source Question Name) is an array
                                      // TODO: Check if any existing code is needed here
                                      console.log("currJSON LAST NESTED IF", currJSON)
                                      for (let k = 0; k < headerName.length; k++) {
                                          let head = headerName[k];
                                          //console.log(currJSON)
                                          //console.log(masterJSON[head])
                                          //console.log(toReturn)
                                          if (toReturn[head.toUpperCase()]) {
                                              toInsert = toReturn[head.toUpperCase()];
                                          }
                                          else {
                                              toInsert = { 'questIds': {} }
                                          }
                                          let questIds = toInsert['questIds']
    
                                          //console.log(questIds)
                                          //console.log(currJSON);
                                          //console.log(currJSON['Variable Name']);
                                          questIds[currJSON['Variable Name'][sourceIndex].toUpperCase()] = {
                                              "conceptId": currJSON['conceptId'],
                                              "concept": currJSON["Current Question Text"]
                                          }
                                          if (isTB) {
                                              questIds[currJSON['Variable Name'][sourceIndex].toUpperCase()]['isTextBox'] = true;
                                          }
                                          if (currJSON['Current Source Question'] && currJSON['Current Source Question'][sourceIndex]) {
                                              toInsert['conceptId'] = currJSON['Current Source Question'][sourceIndex][k].substring(0, 9);
    
                                              toInsert['questionText'] = masterJSON[currJSON['Current Source Question'][sourceIndex][k]]['Current Question Text'];
                                          }
                                          //console.log(masterJSON[head])
    
                                          toReturn[head.toUpperCase()] = toInsert;
                                        }
                                    }
                                }
                            }
                        
                    }
                }
            }
        }

    }
    // console.log("numString cidArr", numString, stringCids) // Testing for Deprecated removal
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
    let filename = './transformationFiles/Quest-' + timestamp + '_Transformation.json';
    // write file
    // fs.writeFileSync(filename, JSON.stringify(toReturn, null, 2));
    // fs.writeFileSync('testDict.json', JSON.stringify(toReturn, null, 2));
    //fs.writeFileSync('toCheckIDs.json', JSON.stringify(toCheckIds,null, 2));

    const ordered = Object.keys(toReturn).sort().reduce(
        (obj, key) => { 
        obj[key] = toReturn[key]; 
        return obj;
        }, 
        {}
    );
    // let filename = './transformationFiles/Quest-' + timestamp + '_Alphabetized_Transformation.json';
    fs.writeFileSync(filename, JSON.stringify(ordered, null, 2)); // ADD BACK LATER
    

    //console.log(JSON.stringify(toReturn));

    /*
    if(changed){
        aggregate.aggregate();
    }*/
    // console.log("toReturn",toReturn)
    // console.log("ordered",ordered)
    
}
module.exports = {
    parseMasterModule: parseMasterModule
}
parseMasterModule();
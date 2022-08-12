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
                if(currJSON['GridID/Source Question Name']){
                    currJSON['GridID/Source Question Name'] = [currJSON['GridID/Source Question Name']];   
                }
                if(currJSON['Source Question']){
                    currJSON['Source Question'] = [currJSON['Source Question']];   
                }
                if(currJSON['Connect Value for Select all that apply questions - Surveys Only']){
                    currJSON['Connect Value for Select all that apply questions - Surveys Only'] = [currJSON['Connect Value for Select all that apply questions - Surveys Only']];   
                }

            }
            
            for (let sourceIndex = 0; sourceIndex < currJSON['Primary Source'].length; sourceIndex++) {

                

                if (currJSON['Primary Source'][sourceIndex] && currJSON['Primary Source'][sourceIndex] === "129084651.json") {
                    //Checks for module name
                    // "898006288.json", "726699695.json"
                    //if(currJSON['Secondary Source'] && ["745268907.json","965707586.json","898006288.json", "726699695.json"].includes(currJSON['Secondary Source'])){
                    //if(currJSON['Secondary Source'] && ["898006288.json", "726699695.json"].includes(currJSON['Secondary Source'])){
                    //if(currJSON['Secondary Source'] && ["640213240.json"].includes(currJSON['Secondary Source'])){
                        
                    if (currJSON['Secondary Source'][sourceIndex] && ["745268907.json","965707586.json","898006288.json", "726699695.json", "716117817.json", "131497719.json", "232438133.json", "299215535.json"].includes(currJSON['Secondary Source'][sourceIndex])) {
                        if (currJSON['Connect Value for Select all that apply questions - Surveys Only'] && currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex]) {
                            let isTB = false;
                            let header = currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex];
                            let toInsert = {};
                            let headerName = currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex];
                            if (currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex] == "77") {
                                //console.log(currJSON)
                                //console.log(headerName)
                            }
                            
                            if (!currJSON['GridID/Source Question Name'] || !currJSON['GridID/Source Question Name'][sourceIndex] || (!Array.isArray(currJSON['GridID/Source Question Name'][sourceIndex]) && currJSON['GridID/Source Question Name'][sourceIndex].toLowerCase().includes('grid_'))) {
                                if (currJSON['GridID/Source Question Name'] && currJSON['GridID/Source Question Name'][sourceIndex] && currJSON['GridID/Source Question Name'][sourceIndex].toLowerCase().includes('grid_')) {
                                    
                                    if (currJSON['Source Question'] && currJSON['Source Question'][sourceIndex]) {
                                        toReturn[currJSON['GridID/Source Question Name'][sourceIndex]] = {
                                            'conceptId': currJSON['Source Question'][sourceIndex].substring(0, 9),
                                            'questionText': masterJSON[currJSON['Source Question'][sourceIndex]]['Question Text']
                                        }
                                    }

                                    
                                }
                                
                               
                               
                                if (currJSON['Format/Value'] && Array.isArray(currJSON['Format/Value'])) {
                                    isTB = false;
                                    let keys = Object.keys(currJSON['Format/Value'])

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
                                        questIds[currJSON['Format/Value'][keys[j]].toUpperCase()] = {
                                            "conceptId": keys[j].substring(0, 9),
                                            "concept": masterJSON[keys[j]]['Question Text'] ? masterJSON[objKeys[k]]['Question Text'] : masterJSON[objKeys[k]]['PII']
                                        }
                                    }
                                    if (currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex] === undefined) {
                                        //console.log(currJSON)
                                    }
                                    toInsert['questionText'] = currJSON['Question Text']
                                    toInsert['conceptId'] = currJSON['conceptId'];
                                    toReturn[currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase()] = toInsert;

                                }
                                else {
                                    if(currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase().includes('ALCLIFE4')){
                                        console.log(currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase())
                                    }
                                    
                                    let val = currJSON['Format/Value']
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
                                            toReturn[currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase()] = toInsert;
                                        }
                                        else {
                                            if(currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase().includes('GRID_')){
                                                toInsert['questionText'] = currJSON['Question Text']
                                                toInsert['conceptId'] = currJSON['conceptId'];
                                                toReturn[currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase()] = toInsert;
                                            }
                                            else{
                                                isTB = true;
                                                toInsert['isTextBox'] = isTB;
                                                toInsert['questionText'] = currJSON['Question Text']
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
                                                    'questionText':currJSON['Question Text'],
                                                    'conceptId':currJSON['conceptId'].substring(0, 9)
                                                }
                                                // console.log(currJSON)
                                                toReturn[name]['conceptId'] = currJSON['Source Question'][sourceIndex].substring(0, 9)
                                                toReturn[name]['concept'] = masterJSON[currJSON['Source Question'][sourceIndex]]['Question Text']
                                            }
                                        }
                                        else{
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
                                                toInsert['questionText'] = currJSON['Question Text']
                                            }
                                            toInsert['conceptId'] = currJSON['conceptId'];
                                            toReturn[currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase()] = toInsert;
                                        }
                                        else {
                                            isTB = true;
                                            toInsert['isTextBox'] = isTB;
                                            if (!toInsert['questionText']) {
                                                toInsert['questionText'] = currJSON['Question Text']
                                            }
                                            toInsert['conceptId'] = currJSON['conceptId'];
                                            toReturn[currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase()] = toInsert;
                                        }
                                    }


                                }


                            }
                            //check if it is a text response (Connect Value)
                            else {
                                if (currJSON['Format/Value'] && typeof currJSON['Format/Value'] === 'object' && currJSON['Format/Value'] !== null) {
                                    isTB = false;
                                }
                                else {
                                    isTB = true;
                                    //console.log(currJSON['Format/Value'])
                                }
                                if (currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex] && !isNaN(currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex])) {
                                    //console.log(currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex])
                                    //console.log(headerName)
                                    isTB = false;
                                }

                                headerName = currJSON['GridID/Source Question Name'][sourceIndex];
                                if (!Array.isArray(headerName)) {

                                    if (headerName == currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex]) {
                                        //console.log('EQUALS')
                                        //console.log(headerName);

                                        let val = currJSON['Format/Value']
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
                                        //console.log(currJSON['Connect Value for Select all that apply questions - Surveys Only'])
                                        // console.log(currJSON)
                                        questIds[currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase()] = {
                                            "conceptId": currJSON['conceptId'],
                                            "concept": currJSON["Question Text"]
                                        }
                                        if (isTB) {
                                           
                                            questIds[currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase()]['isTextBox'] = isTB;
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
                                            "concept": currJSON["Question Text"]
                                        }
                                        if (isTB) {
                                            questIds[currJSON['Connect Value for Select all that apply questions - Surveys Only'][sourceIndex].toUpperCase()]['isTextBox'] = true;
                                        }
                                        if (currJSON['Source Question'] && currJSON['Source Question'][sourceIndex]) {
                                            toInsert['conceptId'] = currJSON['Source Question'][sourceIndex][k].substring(0, 9);

                                            toInsert['questionText'] = masterJSON[currJSON['Source Question'][sourceIndex][k]]['Question Text'];
                                        }
                                        //console.log(masterJSON[head])

                                        toReturn[head.toUpperCase()] = toInsert;



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
                        else if (currJSON['Variable Name'] && currJSON['Variable Name'][sourceIndex]) {
                          let isTB = false;
                          let header = currJSON['Variable Name'][sourceIndex];
                          let toInsert = {};
                          let headerName = currJSON['Variable Name'][sourceIndex];
                          if (currJSON['Variable Name'][sourceIndex] == "77") {
                              //console.log(currJSON)
                              //console.log(headerName)
                          }
                          
                          
                          if (!currJSON['GridID/Source Question Name'] || !currJSON['GridID/Source Question Name'][sourceIndex] || (!Array.isArray(currJSON['GridID/Source Question Name'][sourceIndex]) && currJSON['GridID/Source Question Name'][sourceIndex].toLowerCase().includes('grid_'))) {
                              if (currJSON['GridID/Source Question Name'] && currJSON['GridID/Source Question Name'][sourceIndex] && currJSON['GridID/Source Question Name'][sourceIndex].toLowerCase().includes('grid_')) {
                                  
                                  if (currJSON['Source Question'] && currJSON['Source Question'][sourceIndex]) {
                                      toReturn[currJSON['GridID/Source Question Name'][sourceIndex]] = {
                                          'conceptId': currJSON['Source Question'][sourceIndex].substring(0, 9),
                                          'questionText': masterJSON[currJSON['Source Question'][sourceIndex]]['Question Text']
                                      }
                                  }

                                  
                              }
                              
                             
                             
                              if (currJSON['Format/Value'] && Array.isArray(currJSON['Format/Value'])) {
                                  isTB = false;
                                  let keys = Object.keys(currJSON['Format/Value'])

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
                                      questIds[currJSON['Format/Value'][keys[j]].toUpperCase()] = {
                                          "conceptId": keys[j].substring(0, 9),
                                          "concept": masterJSON[keys[j]]['Question Text'] ? masterJSON[objKeys[k]]['Question Text'] : masterJSON[objKeys[k]]['PII']
                                      }
                                  }
                                  if (currJSON['Variable Name'][sourceIndex] === undefined) {
                                      //console.log(currJSON)
                                  }
                                  toInsert['questionText'] = currJSON['Question Text']
                                  toInsert['conceptId'] = currJSON['conceptId'];
                                  toReturn[currJSON['Variable Name'][sourceIndex].toUpperCase()] = toInsert;

                              }
                              else {
                                  if(currJSON['Variable Name'][sourceIndex].toUpperCase().includes('ALCLIFE4')){
                                      console.log(currJSON['Variable Name'][sourceIndex].toUpperCase())
                                  }
                                  
                                  let val = currJSON['Format/Value']
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
                                          toReturn[currJSON['Variable Name'][sourceIndex].toUpperCase()] = toInsert;
                                      }
                                      else {
                                          if(currJSON['Variable Name'][sourceIndex].toUpperCase().includes('GRID_')){
                                              toInsert['questionText'] = currJSON['Question Text']
                                              toInsert['conceptId'] = currJSON['conceptId'];
                                              toReturn[currJSON['Variable Name'][sourceIndex].toUpperCase()] = toInsert;
                                          }
                                          else{
                                              isTB = true;
                                              toInsert['isTextBox'] = isTB;
                                              toInsert['questionText'] = currJSON['Question Text']
                                              toInsert['conceptId'] = currJSON['conceptId'];
                                              toReturn[currJSON['Variable Name'][sourceIndex].toUpperCase()] = toInsert;
                                          }
                                          
                                      }
                                      
                                  }
                                  else if (typeof val === 'object' && val !== null) {

                                      if (currJSON['GridID/Source Question Name'] && currJSON['GridID/Source Question Name'][sourceIndex] && currJSON['GridID/Source Question Name'][sourceIndex].toLowerCase().includes('grid_') && val['104430631.json'] && val['353358909.json']) {
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
                                          //         'questionText':currJSON['Question Text'],
                                          //         'conceptId':currJSON['conceptId'].substring(0, 9)
                                          //     }
                                          //     // console.log(currJSON)
                                          //     toReturn[name]['conceptId'] = currJSON['Source Question'][sourceIndex].substring(0, 9)
                                          //     toReturn[name]['concept'] = masterJSON[currJSON['Source Question'][sourceIndex]]['Question Text']
                                          // }
                                      }
                                      else{
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
                                              toInsert['questionText'] = currJSON['Question Text']
                                          }
                                          toInsert['conceptId'] = currJSON['conceptId'];
                                          toReturn[currJSON['Variable Name'][sourceIndex].toUpperCase()] = toInsert;
                                      }
                                      else {
                                          isTB = true;
                                          toInsert['isTextBox'] = isTB;
                                          if (!toInsert['questionText']) {
                                              toInsert['questionText'] = currJSON['Question Text']
                                          }
                                          toInsert['conceptId'] = currJSON['conceptId'];
                                          toReturn[currJSON['Variable Name'][sourceIndex].toUpperCase()] = toInsert;
                                      }
                                  }


                              }


                          }
                          //check if it is a text response (Connect Value)
                          else {
                              if (currJSON['Format/Value'] && typeof currJSON['Format/Value'] === 'object' && currJSON['Format/Value'] !== null) {
                                  isTB = false;
                              }
                              else {
                                  isTB = true;
                                  //console.log(currJSON['Format/Value'])
                              }
                              if (currJSON['Variable Name'][sourceIndex] && !isNaN(currJSON['Variable Name'][sourceIndex])) {
                                  //console.log(currJSON['Variable Name'][sourceIndex])
                                  //console.log(headerName)
                                  isTB = false;
                              }

                              headerName = currJSON['GridID/Source Question Name'][sourceIndex];
                              if (!Array.isArray(headerName)) {

                                  if (headerName == currJSON['Variable Name'][sourceIndex]) {
                                      //console.log('EQUALS')
                                      //console.log(headerName);

                                      let val = currJSON['Format/Value']
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
                                      //console.log(currJSON['Variable Name'])
                                      // console.log(currJSON)
                                      questIds[currJSON['Variable Name'][sourceIndex].toUpperCase()] = {
                                          "conceptId": currJSON['conceptId'],
                                          "concept": currJSON["Question Text"]
                                      }
                                      if (isTB) {
                                         
                                          questIds[currJSON['Variable Name'][sourceIndex].toUpperCase()]['isTextBox'] = isTB;
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
                                          "concept": currJSON["Question Text"]
                                      }
                                      if (isTB) {
                                          questIds[currJSON['Variable Name'][sourceIndex].toUpperCase()]['isTextBox'] = true;
                                      }
                                      if (currJSON['Source Question'] && currJSON['Source Question'][sourceIndex]) {
                                          toInsert['conceptId'] = currJSON['Source Question'][sourceIndex][k].substring(0, 9);

                                          toInsert['questionText'] = masterJSON[currJSON['Source Question'][sourceIndex][k]]['Question Text'];
                                      }
                                      //console.log(masterJSON[head])

                                      toReturn[head.toUpperCase()] = toInsert;



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
    fs.writeFileSync(filename, JSON.stringify(ordered, null, 2));


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

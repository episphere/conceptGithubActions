//See if actions works on forks
const fs = require('fs');
const readline = require('readline')
let conceptIdVariants = ["@id","conceptId"];

let jsonList = [];

function getConceptIdIndex (header){
    for(let j = 0; j < conceptIdVariants.length; j++){
        let index = header.indexOf(conceptIdVariants[j])
        if(index != -1){
            return index;
        }
    }
    return -1;
}

function generateNine(){ // Generate nine digit number, first number must be 1 - 9 and other proceeding numbers will be 0 - 9
    let a = ''
    a += Math.floor(Math.random()*9 + 1)
    for(let i = 1; i < 9; i++){
        let b = Math.floor(Math.random()*10)
        a += b
    }
    return a;
}

function generateRandomUUID(conceptIdList){ // continue to create unique 9 digit number until generated 9 digit number not found in --> conceptIdList
    //return uuidv4();
    let num = generateNine()
    while(!conceptIdList.includes(num)){
        let num = generateNine();
        return num;
    }
}

function replaceQuotes(text){
    //text = text.replace(/\"\"+/g,'\"\"')
    return text;
}

/**
 * processCluster - for the current row as a readable streamline file
 * @param {array} cluster - current row after header row, array of row cell items within an array
 * @param {array} header - header items of the first row
 * @param {object} nameToConcept - varToConcept object library mapping --> Ex.{"0":"918573169","1":"349122068","Sanford Health":"657167265", "Menstrual Cycle":"232438133"}
 * @param {number} indexVariableName - conceptId index location of question Text - should be 10
 * @param {object} conceptIdList - object type array from conceptIds.txt file
 * @param {object} conceptIdObject - object mapping of conceptId index value to next header string value --> Ex. { 2: 'Primary Source', 4: 'Secondary Source', 6: 'Source Question', 9: 'Question Text', 16: 'Format/Value'}
 * @param {array} sourceJSONS - array of objects from each individual concept id json
 * @param {array} jsonList - empty array []
 * @param {string} regexInclude - regex string /[0-9]+\s*=/
 *  


 */

// NOTE TO SELF: Add another paramater with the concepts for other possible headers? (This is for the if blocks before LOOP 4)
function processCluster(cluster, header, nameToConcept, indexVariableName, conceptIdList, conceptIdObject, sourceJSONS, jsonList, regexInclude, numCounter){
    console.log("conceptIdList", numCounter, conceptIdList)
    /* console.log('cluster 0',numCounter,cluster[0]) */ // cluster value will be previous cluster instead of current arr, reassigned after processCluster
    /* Cluster will be length 1 if no, question text rows are proceeded afterwards*/
    // console.log("conceptIdObject", conceptIdObject)
    /*
    num index is conceptId header, value is header to the right of conceptId index
    conceptIdObject --> { '2': 'Primary Source','4': 'Secondary Source','6': 'Source Question','9': 'Question Text','16': 'Format/Value'}
    */
    let nonEmpty = []; // to mark during iterating an array item, known to be NOT empty later in looping process
    let conceptIdObjectKeys = Object.keys(conceptIdObject) // array of keys from conceptIdObject --> Ex. [ '2', '4', '6', '9', '16' ]
    let conceptIdIndices = []; // pushed conceptId indices as num values --> Ex. [2, 4, 6, 9, 16] 
    let generalId = -1;
    /*
        Key(Header  after concept ID), value (concept Id index before header) 
        Ex. {'Primary Source': 2, 'Secondary Source': 4, 'Source Question': 6, 'Question Text': 9, 'Format/Value': 16}
    */ 
    let conceptIdReverseLookup = {}; 
    /* 
    LOOP 1 - DONE
    populate conceptIdIndices and conceptIdReverseLookup
    */

    for(let i = 0; i < conceptIdObjectKeys.length; i++){ // conceptIdObject --> Ex. [ '2', '4', '6', '9', '16' ]
        conceptIdIndices.push(parseInt(conceptIdObjectKeys[i]))
        conceptIdReverseLookup[conceptIdObject[conceptIdObjectKeys[i]]] = parseInt(conceptIdObjectKeys[i])
        // console.log("PC Loop 1",i, conceptIdObject[conceptIdObjectKeys[i]]) // Ex. {'Primary Source': 2, 'Secondary Source': 4, 'Source Question': 6, 'Question Text': 9, 'Format/Value': 16}
    }
    // console.log("conceptIdReverseLookup", conceptIdReverseLookup)
    // console.log('cluster processCluster',numCounter, cluster, cluster.length)

    /* 
    LOOP 2 - DONE 
    Iterate through current cluster's rows (ONLY with questionText value )
    for each row proceeding first row, iterate array's items and check if there not an item and not found in conceptIdIndicies
    This will push to nonEmpty array for later use
    */
    // console.log("cluvster & numCounter", numCounter, cluster)
    for(let i = 1; i < cluster.length; i++){ /* starts at 1 to not include main cluster, but rows without questionText index belonging to current cluster; push to nonEmpty arr*/
        let currArr = cluster[i] 
        console.log("cluster loop 2", numCounter, cluster)
        console.log('currArr',i, currArr, numCounter) // output proceeding rows belonging to cluster's first row
        for(let j = 0; j < currArr.length; j++){
            // console.log("conceptIdIndices j", j, currArr[j].trim(),currArr[j].trim()!='',!conceptIdIndices.includes(j))
            if(currArr[j].trim()!='' && !conceptIdIndices.includes(j)){ // not empty item, current iteration j not found in array
                if(!nonEmpty.includes(j)){ // current j iteration not found, add iteration to nonEmpty arr
                    nonEmpty.push(j)
                    // console.log("nonEmpty", j, nonEmpty)
                }
            }
        }
    }

    /* 
    Map header to related first row value item 
    {'Formula for Index': '1', Index: '1','Primary Source': 'Recruitment'...}

    Note:ConceptId skipped for 2nd index (Reference: conceptIdIndices --> [2, 4, 6, 9, 16] )
    */
    let firstRowJSON = {} 
    let firstRow = cluster[0] // row with a questionText value
    let clump = []; // NOT USED - DEPRECATED
    // console.log('processCluster firstRow',numCounter, firstRow)
    console.log('nonEmpty', nonEmpty)
    
    /* 
    LOOP 3 - DONE
    Loop first Row array of items
    push header and firstRow value to firstRowJSON based on conditions
    Note to self: Revisit or determine purpose for nonEmpty array?
    Answer: to mark during iterating an array item that is known to be not empty later in looping process

    Added Note: Find out why concept Id indices 9 is being pushed in loop
    index 9 gets pushed via conceptIdIndices array has 9 value AND conceptIdObject obj key 9 === "Question Text"
    Ex. numCounter 3 --> Cluster 1 / row 1
    */
    for(let i = 0; i < firstRow.length; i++){ // check each item for the following conditions
        // console.log("clusterProcess firstRow loop 3", numCounter, firstRow)
        /*
        ALL TRUE -- > firstRow current item MUST NOT BE EMPTY; nonEmpty current loop count not found in array; current loop count not found in conceptIdIndices
        OR current loop count found in conceptIdIndices and current loop count 16 conceptIdObject must be "Question Text"

        Continue to append to firstRowJSON key and value
        */
        if((firstRow[i] != "" && !nonEmpty.includes(i) && !conceptIdIndices.includes(i)) || (conceptIdIndices.includes(i) && conceptIdObject[i] =="Question Text")){
            // console.log("header firstRow",typeof header[i],header[i], firstRow[i])
            // REMOVE LATER -- > concept Id key and 
            if((conceptIdIndices.includes(i) && conceptIdObject[i] =="Question Text")) { console.log("test loop 3 OR cond", i ,conceptIdObject[i])}
            firstRowJSON[header[i]] = firstRow[i]
            // console.log("firstRowJSON loop 3 - ", `numCounter:`,numCounter,`curr i:`, i, firstRowJSON)
        }
    }
    console.log("firstRowJSON", numCounter, firstRowJSON) // ADD BACK LATER WHEN LOOP 3
    console.log("nameToConcept",numCounter, nameToConcept)// ADD BACK LATER WHEN for IF
    // console.log("test!!!", numCounter, firstRow[indexVariableName],indexVariableName)
    //Creating concept Id for the cluster
    // firstRowJSON = {}
    // console.log("conceptIdList", conceptIdList) // ADD BACK LATER WHEN for IF 
    /*
    Outer If 1 - WIP
    // firstRowJSON inital value empty {}; no conceptId property or conceptId value empty ''
    THIS IS WHERE concept Id generation occurs 
    */
    if(!firstRowJSON.hasOwnProperty('conceptId') || firstRowJSON['conceptId'] == ''){ // TODO: MAKE A TEST WHERE THIS IS RUN
        console.log("START", numCounter,[firstRow[indexVariableName]])
        /*
         Checks varToConceptJson obj if the current first cluster row has question text
         Found --> append conceptId key with matched question text value to nameToConcept
         Not Found --> push concepId key with uuid number to firstRowJSON, push conceptId to conceptIdList, append questionText key with conceptId to nameConcept
         Note: nameToConcept is varToConcept object
        */

        // check for question text, delete and filter out at the end other concept Ids not in use?
        if(nameToConcept.hasOwnProperty(firstRow[indexVariableName])){ //firstRow[indexVariableName] --> questionText of first row (firstRow = cluster[0])
            // assign question Text
            firstRowJSON['conceptId'] = nameToConcept[firstRow[indexVariableName]] // "conceptId#.json": Question Text value
            if(!conceptIdList.includes(firstRowJSON['conceptId'])){ // conceptId  NOT FOUND in arr based off of .txt file, push concept Id question text value
                conceptIdList.push(firstRowJSON['conceptId'])
            }
            
        }
        else{ // generate conceptId, append unfound questionText to new concept ID mapping
             firstRowJSON['conceptId'] = generateRandomUUID(conceptIdList);
            //  console.log("else firstRowJSON",firstRowJSON)
             conceptIdList.push(firstRowJSON['conceptId'])
             nameToConcept[firstRow[indexVariableName]] = firstRowJSON['conceptId']
            //  console.log("else nameToConcept", nameToConcept)
        }
    }


    firstRow[conceptIdReverseLookup['Question Text']] = firstRowJSON['conceptId']

    //find sources first
    let conceptColNames = Object.keys(conceptIdReverseLookup)
    
    console.log("conceptIdReverseLookup", conceptIdReverseLookup)
    console.log("conceptColNames", conceptColNames)
    /* 
    LOOP 4
    conceptColNames are headers for concept Ids
    conceptColNames --> Ex. ['Primary Source','Secondary Source','Source Question','Question Text','Format/Value']
    loop conceptColNames

    Search for text "Source" in each column item AND checks first row for concept ID for all indices with Source
    // conceptIdReverseLookup -->  Ex. {'Primary Source': 2, 'Secondary Source': 4, 'Source Question': 6, 'Question Text': 9, 'Format/Value': 16}
    */ 
    console.log("firstRow",numCounter, firstRow)
    // console.log("conceptIdReverseLookup",numCounter,conceptIdReverseLookup)
    // console.log("sourceJSONS", sourceJSONS)
    console.log("cluster[0]",firstRow)
    for(let i = 0; i < conceptColNames.length; i++){ // 5 loops,  conceptColNames -> ['Primary Source','Secondary Source','Source Question','Question Text','Format/Value']
        // console.log("conceptColNames", i,conceptColNames[i], conceptColNames[i].indexOf('Source'))
        // +1 because of conceptIdReverseLookup 
        // conceptIdReverseLookup[conceptColNames[i]] + 1
        // first if block will be firstRow[3], Primary Source value in firstRow
        // only Source columns
        // conceptIdReverseLookup -->  Ex. {'Primary Source': 2, 'Secondary Source': 4, 'Source Question': 6, 'Question Text': 9, 'Format/Value': 16}
        if(conceptColNames[i].indexOf('Source') != -1 && firstRow[conceptIdReverseLookup[conceptColNames[i]] + 1] != ''){ 
            // console.log("value of concept id", numCounter, i ,conceptColNames[i].indexOf('Source'),firstRow[conceptIdReverseLookup[conceptColNames[i]] + 1])
            for(let k = 0; k < cluster.length; k++){ // k is current cluster item in list
                // console.log("loop 4 nested for loop k", conceptIdReverseLookup[conceptColNames[i]] + 1)
                // console.log("TEST loop 4 nested for loop k", numCounter ,firstRow[conceptIdReverseLookup[conceptColNames[i]] + 1])
                // Note: loop over current cluster's source header index value, 3 loops given header Source value text exists 
                if(cluster[k][conceptIdReverseLookup[conceptColNames[i]] + 1] != ""){ //Source header value text exists
                    // console.log(`cluster - ${k}, conceptColName idx - ${i}`,numCounter, conceptIdReverseLookup[conceptColNames[i]], cluster[k] ) // REVISIT LATER
                    let currId = cluster[k][conceptIdReverseLookup[conceptColNames[i]]]; // currId --> conceptId,  (empty if nothing is found in orignal csv or no reference in varToConcept.json)
                    // console.log("loop 4 currId and currVarName", currId)
                    let currVarName = cluster[k][[conceptIdReverseLookup[conceptColNames[i]] + 1]] // currVarName --> text value belonging to any source conceptColNames index
                    // console.log("loop 4 check header cid index", numCounter, currId,currVarName, nameToConcept)

                    if(currId == '' && nameToConcept.hasOwnProperty(currVarName)){ // varToConcept.json KEY CHECK - Primary, Secondary, Source
                        currId = nameToConcept[currVarName]
                        // console.log('abc: ' + currId)
                    }
                    // console.log("cluster[k]",cluster[k],currId)
                    let found = -1;
                    //console.log(sourceJSONS.length)
                    // For loop run given there are conceptId#s in the json folder (initally they are removed)
                    for(let j = 0; j < sourceJSONS.length; j++){ // loop over sourceJSONS array (array of conceptId# objects)
                        let currJSON = sourceJSONS[j];
                        // console.log("currId EQUALITY" ,numCounter,currId != "", currJSON['conceptId'], currId)
                        if(currId != '' && currJSON['conceptId'] == currId){  // conceptId exists and current conceptId#.json matches currId variable (cluster cid)
                            found = i;
                            if(!currJSON['subcollections'].includes(firstRowJSON['conceptId'] + '.json')){ // No subcollection key in current json item
                                currJSON['subcollections'].push(firstRowJSON['conceptId'] + '.json') // add conceptId from firstRowJSON
                            }
                            j = sourceJSONS.length; // ends loop
                        }
                        // NOTE: Might have to change this later since Question Text is used for all columns with cid and text association
                        else if(currId == '' && currVarName == currJSON['Question Text']){ 
                            found = i;
                            currId = currJSON['conceptId'];
                            if(!currJSON['subcollections'].includes(firstRowJSON['conceptId'] + '.json')){
                                currJSON['subcollections'].push(firstRowJSON['conceptId'] + '.json')
                            }
                            j = sourceJSONS.length
                        }
                    }
                    if(found == -1){ // TODO: ADD DIFFERENT KEYS HERE?
                        //subcollections
                        let newJSON = {}
                        if(currId == '' ){
                            currId = generateRandomUUID(conceptIdList);
                        }
                        
                        newJSON['conceptId'] = currId;
                        newJSON['Question Text'] = currVarName;
                        newJSON['subcollections'] = [firstRowJSON['conceptId'] + '.json']
                        sourceJSONS.push(newJSON)
                        // console.log("mewJSON", numCounter,newJSON)
                    }
                    // add currVarName and currId to nameToConcept
                    nameToConcept[currVarName] = currId
                    if(!conceptIdList.includes(currId)){ // Check if currId exists in conceptIds.txt
                        conceptIdList.push(currId)
                    }
                    
                    if(k > 0){ // k is index from cluster iteration, i is current header
                        // console.log("k > 0", numCounter, firstRowJSON[header[conceptIdReverseLookup[conceptColNames[i]] + 1]])
                        if(!Array.isArray(firstRowJSON[header[conceptIdReverseLookup[conceptColNames[i]] + 1]])){
                            firstRowJSON[header[conceptIdReverseLookup[conceptColNames[i]] + 1]] = [firstRowJSON[header[conceptIdReverseLookup[conceptColNames[i]] + 1]]]
                            firstRowJSON[header[conceptIdReverseLookup[conceptColNames[i]] + 1]].push(currId + '.json')
                        }
                        firstRowJSON[header[conceptIdReverseLookup[conceptColNames[i]] + 1]].push(currId + '.json')
                    }
                    else{
                        firstRowJSON[header[conceptIdReverseLookup[conceptColNames[i]] + 1]] = currId + '.json'
                    }
                    cluster[k][conceptIdReverseLookup[conceptColNames[i]]] = currId;
                    // console.log("cluster appending", numCounter,i, cluster[k][conceptIdReverseLookup[conceptColNames[i]]], currId, cluster[k])
                }
            }
        }
    }

    let collections = [];
    let collectionIds = {};
    let leaves = []
    let leafIndex = -1;
    
    let debug = true;
    

    let arrays = {};
    /* 
    LOOP 5
    THIS RUNS WHEN CLUSTER HAS MORE THAN ONE ROW

    Loop over nonEmpty array Ex. nonEmpty -> [ 0, 1, 17 ]
    nonEmpty with items --> cluster with more than 1 row

    generate cids for extra cluster rows?
    
    loops purpose is for clusters rows after main row with only 'Format/Value'
    */
    // console.log("nonEmpty checks", numCounter, nonEmpty)
    console.log("jsonList bLoop5",numCounter,jsonList) // NOTE: Refer to Loop 6 where things may get added
    // console.log("nameToConcept", nameToConcept)
    for(let j = 0; j < nonEmpty.length; j++){
        let currIndex = nonEmpty[j]
        let nonEmptyIndex = currIndex;
        let currCol = [];
        let leafObj = {}
        for(let i = 0; i < cluster.length; i++){
            let currRow = cluster[i];
            console.log("loop 5 currRow cluster",numCounter,currRow )
            if(currIndex < currRow.length) { //loop over nonEmpty items (stop loop if currIndex length greater than length of cluster row)
            let currElement = currRow[currIndex].trim();
            // currRow[0], currRow[1],  currRow[17] value EXISTS for conditional
            if(currElement != ''){
                //Create conceptIds if this exists
                // conceptIdObject --> { '2': 'Primary Source','4': 'Secondary Source','6': 'Source Question','9': 'Question Text','16': 'Format/Value'}
                // for now works only with 'Format/Value'(using test masterFileCopy) --> conceptIdObject[17 - 1]
                if(conceptIdObject[currIndex - 1]){
                    // console.log("loop 4 tester",numCounter,conceptIdObject[currIndex - 1])
                    if(currElement.indexOf('=') != -1){ /* ONLY FOR FORMAT/VALUE WITH '=' VALUE */ 
                        console.log("Format/value with equals", currElement) // Ex. --> '1 = Active'
                        let val = currElement.split('=')[1].trim() // gets num value, Ex. --> '1'
                        let key = currElement.split('=')[0].trim() // gets key value, Ex. --> 'Active'
                        let cid = generateRandomUUID(conceptIdList) // conceptIdList is the .txt of cids, this updates .txt file --?fs.writeFileSync('./jsons/conceptIds.txt', JSON.stringify(conceptIdList))
                        // console.log("Loop 5 - nameToConcept", numCounter,nameToConcept)
                        if(nameToConcept.hasOwnProperty(val)){ // FOUND in nameToConcept(temp varToConcept), reassigns autogenerated cid number
                            cid = nameToConcept[val]
                        }
                        if(currRow[nonEmptyIndex - 1] != ''){ // Format/value, EXISTS cid index (nonEmptyIndex = 17 - 1), ignore 0,1 (no cids)
                            cid = currRow[nonEmptyIndex - 1];
                        }
                        
                        let found = false;
                        for(let k = 0; k < jsonList.length; k++){ // jsonList (json objects) refer to loop 6, loop entire json list of objects
                            if(jsonList[k].hasOwnProperty('conceptId') && jsonList[k]['conceptId'] == cid){
                                found = true;
                            }
                        }
                        if(found == false){
                            jsonList.push({'conceptId':cid, 'Question Text':val})
                            // fs.writeFileSync('./jsons/' + cid + '.json', JSON.stringify({'conceptId':cid, 'Question Text':val},null, 2)) // this adds to the jsons folder
                            // fs.writeFileSync('./jsonsTEST/' + cid + '.json', JSON.stringify({'conceptId':cid, 'Question Text':val},null, 2)) // TESTING PURPOSES
                            nameToConcept[val] = cid
                        }
                        if(!conceptIdList.includes(cid)){
                            conceptIdList.push(cid)
                        }
                        if(!leafObj[nonEmptyIndex]){
                            leafObj[nonEmptyIndex] = {}
                        }
                        leafObj[nonEmptyIndex][cid + '.json'] = key;
                        //leafObj[cid + '.json'] = key
                        currRow[nonEmptyIndex-1] = cid
                    }
                    
                    else{
                        let cid = generateRandomUUID(conceptIdList)
                        if(nameToConcept.hasOwnProperty(currElement)){
                            cid = nameToConcept[currElement]
                        }
                        if(currRow[nonEmptyIndex - 1] != ''){
                            cid = currRow[nonEmptyIndex-1];
                        }
                        
                        let found = false;
                        for(let k = 0; k < jsonList.length; k++){
                            if(jsonList[k].hasOwnProperty('conceptId') && jsonList[k]['conceptId'] == cid){
                                found = true;
                            }
                        }
                        if(found == false){
                            jsonList.push({'conceptId':cid, 'Question Text':currElement})
                            // fs.writeFileSync('./jsons/' + cid + '.json', JSON.stringify({'conceptId':cid, 'Question Text':currElement},null, 2))
                            nameToConcept[currElement] = cid
                        }
                        if(!conceptIdList.includes(cid)){
                            conceptIdList.push(cid)
                        }
                        currRow[nonEmptyIndex-1] = cid
                        currCol.push(cid + '.json')
                        
                    }
                }
                else{
                    currCol.push(currElement)
                }
            }
          }
        }
        //console.log(firstRowJSON)
        //If they are in the 0=No form
        if(Object.keys(leafObj).length > 0){

            firstRowJSON[header[nonEmptyIndex]] = leafObj[nonEmptyIndex];
        }
        //If they do not have indices
        else{
            //Add the cols to the current json
            firstRowJSON[header[nonEmptyIndex]] = currCol;
        }

        //console.log(nonEmpty)
        //console.log('----------------------------------')
        
        
    }

    /* LOOP 6*/
    for(let i  = 0; i < Object.keys(conceptIdObject).length; i++){
        let key = parseInt(Object.keys(conceptIdObject)[i]) + 1
        let val = conceptIdObject[key-1]

        if(!(val.includes('Source') || val.includes('Src') || val.includes('Question Text') || val.includes('Connect Value for Select all that apply questions') || nonEmpty.includes(key) || !firstRow[key].match(regexInclude)) && firstRow[key] != ''){
            console.log(val)
            console.log(firstRow[key])
            
            let currVal = firstRow[key]
            let elementNumber = -1;
            let equalFound = false;
            if(currVal.indexOf('=') != -1){
                let currElement = currVal;
                currVal = currElement.split('=')[1].trim()
                elementNumber = currElement.split('=')[0].trim()
                equalFound = true;
            }
            let cid = generateRandomUUID(conceptIdList)
            if(nameToConcept.hasOwnProperty(currVal)){
                cid = nameToConcept[currVal]
            }
            if(firstRow[key - 1] != ''){
                cid = firstRow[key-1];
            }
            
            let found = false;
            for(let k = 0; k < jsonList.length; k++){
                if(jsonList[k].hasOwnProperty('conceptId') && jsonList[k]['conceptId'] == cid){
                    found = true;
                }
            }
            if(found == false){
                jsonList.push({'conceptId':cid, 'Question Text':currVal})
                // fs.writeFileSync('./jsons/' + cid + '.json', JSON.stringify({'conceptId':cid, 'Question Text':currVal},null, 2))
                nameToConcept[currVal] = cid
            }
            if(!conceptIdList.includes(cid)){
                conceptIdList.push(cid)
            }
            firstRow[key-1] = cid
            if(equalFound){
                firstRowJSON[val] = {};
                firstRowJSON[val][cid + '.json'] = elementNumber;
            }
            else{
                firstRowJSON[val] = cid + '.json';
            }
        }
    }

    if(cluster[0][conceptIdReverseLookup['Question Text']] == ''){

        firstRowJSON['conceptId'] = generateRandomUUID(conceptIdList);
        if(nameToConcept.hasOwnProperty(firstRowJSON[header[indexVariableName]])){
            firstRowJSON['conceptId'] = nameToConcept[firstRowJSON[header[indexVariableName]]];
        }
        cluster[0][conceptIdReverseLookup['Question Text']] = firstRowJSON['conceptId']
        nameToConcept[firstRowJSON[header[indexVariableName]]] = firstRowJSON['conceptId']
    }
    else{
        firstRowJSON['conceptId'] = cluster[0][conceptIdReverseLookup['Question Text']]
        nameToConcept[firstRowJSON[header[indexVariableName]]] = firstRowJSON['conceptId']
    }
    let firstRowJSONFound = findJSON(jsonList, firstRowJSON['Question Text']);
    if(firstRowJSONFound){
        //console.log(firstRowJSONFound)

        let keys = Object.keys(firstRowJSONFound);
        //console.log(firstRowJSONFound)
        //console.log(firstRowJSON)
        let foundSources = false
        let maxLength = -1;
        for(i in keys){
            let key = keys[i]
            if(key.includes('Source') || key.includes('Src') || key.includes('Variable Name') || key.includes('Connect Value for Select all that apply questions')){
                foundSources = true;
                let thisSource = firstRowJSONFound[key]
                if(firstRowJSON[key]){
                    if(Array.isArray(thisSource)){
                        thisSource.push(firstRowJSON[key])
                    }
                    else{
                        firstRowJSONFound[key] = [thisSource];
                        firstRowJSONFound[key].push(firstRowJSON[key])

                    }
                    maxLength = firstRowJSONFound[key].length;
                    
                }
                else{
                    if(Array.isArray(thisSource)){
                        thisSource.push('')
                    }
                    else{
                        firstRowJSONFound[key] = [thisSource];
                        firstRowJSONFound[key].push('')

                    }
                }
            }
        }
        let currKeys = Object.keys(firstRowJSON);
        for(i in currKeys){
            let key = currKeys[i];
            if(key.includes('Source') || key.includes('Src') || key.includes('Variable Name') || key.includes('Connect Value for Select all that apply questions')){
                if(!firstRowJSONFound[key]){
                    firstRowJSONFound[key] = [];
                    for(i = 0; i < maxLength-1; i++){
                        firstRowJSONFound[key].push('');
                    }
                    firstRowJSONFound[key].push(firstRowJSON[key]);

                }
            }
            else{
                if(!firstRowJSONFound[key]){
                    firstRowJSONFound[key] = firstRowJSON[key];
                }
            }
        }
        //console.log(firstRowJSONFound)
        //console.log(firstRowJSON)
        firstRowJSON = firstRowJSONFound
        //console.log(firstRowJSON)

    }
    else{
        let currKeys = Object.keys(firstRowJSON);
        for(i in currKeys){
            let key = currKeys[i];
            if(key.includes('Source') || key.includes('Src') || key.includes('Variable Name') || key.includes('Connect Value for Select all that apply questions')){
                firstRowJSON[key] = [firstRowJSON[key]];
            }
        }
    }
    jsonList.push(firstRowJSON);
    // fs.writeFileSync('./jsons/' + firstRowJSON['conceptId'] + '.json', JSON.stringify(firstRowJSON,null, 2))
    // console.log("cluster",cluster)

}
/* -------------- FINISH PROCESS CLUSTER --------------*/


function findJSON(jsonList, questionText){ // loop entire jsonList, find match between question Text of param1 and param2, return json 
    //console.log('finding: ' + questionText)
    for(let i = 0; i < jsonList.length;i++){
        let json = jsonList[i];
        if(json['Question Text'] == questionText){
            return json;
        }
    }
    return undefined;
}

function CSVToArray(strData){ // Takes current row as a string, returns an array
    let orig = strData; // Not needed anymore?
    strData = strData.trim(); 
    let arr = []; // info from toPush variable
    let finalPush = true;
    let num = 0 // added to see current count
    while(strData.indexOf(",") != -1 ){ // searches inside current string for comma
        
        // console.log("test \"", num,strData.indexOf(","), strData, strData.substring(0,1) == "\"")
        let toPush = ""; // each loop is new toPush value
        if(strData.substring(0,1) == "\""){ // check first character for quote chracter
            // console.log("For thy quotes!")
            strData = strData.substring(1); // all characters after quote " (first quote doesn't count)     
            // console.log("strData", strData)
            let nextLook = strData.indexOf('\"\"') // index - double quotes "" (must be double quotes)
            let nextQuote = strData.indexOf('\"'); // index - single quote " "
            // console.log(num ,"nextLook,nextQuote",nextLook,nextQuote)
            let numQuotes = 0 
            while(nextLook != -1 && nextLook == nextQuote){ // pushes from start to end of "\"\"
                ////console.log(nextLook)
                toPush += strData.substring(0,nextLook) + '\"\"' // pushes only double quotes; (0,nextLook) is empty string no value + "" --> ""
                // console.log("toPush 1", toPush)
                strData = strData.substring(strData.indexOf("\"\"") + 2);   // reassign to all text after double quotes 
                if(orig.includes('Ever took hormones to reflect your gender')){
                    ////console.log(strData.substring(strData.indexOf("\"\"") + 2));
                    ////console.log('------------------------')
                }
                // console.log("before",nextLook,nextQuote, strData)
                nextLook = strData.indexOf('\"\"') // get index of first quote
                nextQuote = strData.indexOf('\"');
                // console.log("after",nextLook,nextQuote, strData)
                numQuotes++
                // console.log("numQuotes",numQuotes)
            }

            // console.log("toPush",strData.substring(0,strData.indexOf("\"")))

            toPush += strData.substring(0,  strData.indexOf("\""));    
            strData = strData.substring(strData.indexOf("\"") + 1);
            if(orig.includes('Ever took hormones to reflect your gender')){
                ////console.log(strData.substring(strData.indexOf("\"") + 1));
                ////console.log('------------------------')
            }
            strData = strData.substring(strData.indexOf(',')+1) // all text after comma
            if(strData.trim() == ''){
                finalPush = false
            }
        }
        else{
            toPush = strData.substring(0, strData.indexOf(',')); // push from start of strData up to next comma ("," not included); Note: strData.indexOf(',') is 0 if current value is comma
            // console.log(num, toPush,"strDATA",strData)
            strData = strData.substring(strData.indexOf(',') + 1) // reassign strData to start at next "," occurence (not including comma) by increasing indexOf value
            // console.log("strData toPush", strData.indexOf(','),toPush)
        }
        // console.log('toPush',toPush,num)
        arr.push(toPush.trim())
        //let nextQuote = strData.indexOf("\"")
        num ++
    }
    if(finalPush == true){ // strData val gets reassigned, so last becomes nothing
        // console.log("final push ,arr", arr,"strData", strData)
        arr.push(strData.trim());
    }

    // Return the parsed data.
    return( arr );
}

function getConceptIdCols(header){ // pushing object of headers with concept Ids
    // console.log("header",header)
    let toReturn = {}
    for(let i = 0; i < header.length;i++){
        if(header[i] == 'conceptId'){
            // console.log("header conceptId",i,header[i])
            if(i + 1 < header.length && header[i+1] != 'conceptId'){ // check header after concept Id in list; concept Id before column header
                // console.log("header after", header[i+1])
                toReturn[i] = header[i+1]; // Ex. {'2': 'Primary Source',}
            }
            else{
                console.error('Header Error (conceptIds not in correct place)')
            }
            
        }
    }
    // console.log(toReturn) 
    /* { '2': 'Primary Source','4': 'Secondary Source','6': 'Source Question','9': 'Question Text','16': 'Format/Value'} */
    return toReturn
    
}

async function readFile(fileName){ // MAIN FUNCTION STARTS HERE ********************************************************************************
    // console.log("fileName",fileName)
    let jsonList = []
    let sourceJSONS = [] // array of each conceptId#.json object
    // fs.readdirSync('./jsons/').forEach(file => {
    //     if(file.match(/[0-9]{9}.json/)){
    //         let currFileContents = fs.readFileSync('./jsons/' + file);
    //         // console.log("currFileContents", currFileContents)
    //         let currJSON = JSON.parse(currFileContents)
    //         // console.log("currJSON",file,currJSON)
    //         sourceJSONS.push(currJSON);
    //     }
    // });


    fs.readdirSync('./jsonsTest/').forEach(file => { // jsonsTest Folder (TEST FILE READ)
        /* 
        NOTE: Might need to change regex with V1 or V2? Will conceptId#'s have v1 or v2 endings? How will this impact the library moving forward? 
        [0-9]{9}_v[1-2]
        */
        
        if(file.match(/[0-9]{9}.json/)){ 
            let currFileContents = fs.readFileSync('./jsonsTest/' + file);
            // console.log("currFileContents", currFileContents)
            let currJSON = JSON.parse(currFileContents)
            // console.log("currJSON",file,currJSON)
            sourceJSONS.push(currJSON);
        }
    });
    // console.log('sourceJSONS value', sourceJSONS)

    let ConceptIndex = '{}' // becomes varToConcept.json list (FOUND), {} (NOT FOUND)
    /* Add back origin varToConcept.json */
    // if(fs.existsSync('./jsons/varToConcept.json')){                 /*  USES / READS --> VARTOCONCEPT.JSON LIBRARY!!!!!  */
    //     ConceptIndex = fs.readFileSync('./jsons/varToConcept.json', {encoding:'utf8'})
    // }
    if(fs.existsSync('./jsonsTest/varToConceptTest.json')){
        ConceptIndex = fs.readFileSync('./jsonsTest/varToConceptTest.json', {encoding:'utf8'}) // MAKE CHANGES TO LIBRARY FOR TESTING 
    }
    // console.log("ConceptIndex!!!", typeof ConceptIndex, typeof JSON.parse(ConceptIndex), JSON.parse(ConceptIndex))
    let toReplace = fs.readFileSync(fileName,{encoding:'utf8', flag:'r'})
    
    // console.log("toReplace",typeof toReplace, toReplace) // entire string csv file

    toReplace = toReplace.replace(/�/g, "\"")
    
    // toReplace = toReplace.replace(/¬Æ/g, "®")
    // toReplace = toReplace.replace(/‚Äú/g, "“") 
    // toReplace = toReplace.replace(/‚Äù/g, "”")
    // toReplace = toReplace.replace(/‚Ä¶/g, "…")
    // toReplace = toReplace.replace(/√®/g, "è")
    // toReplace = toReplace.replace(/‚Ä¶/g, "…")
    toReplace = replaceQuotes(toReplace) // replaceQuotes has no affect
    fs.writeFileSync(fileName, toReplace) // rewrite fileName with regex conditions
    let idIndex = '[]'
    /* Add back origin conceptIds.txt */
    // if(fs.existsSync('./jsons/conceptIds.txt')){
    //     idIndex = fs.readFileSync('./jsons/conceptIds.txt', {encoding:'utf8'}) // Array of concept Ids (string) (Note: purpose of the string array of strings '['...','...',....]'
    // }
    /*Might be used for concept Id one to one mapping*/
    if(fs.existsSync('./jsonsTest/conceptIdsTest.txt')){ 
            idIndex = fs.readFileSync('./jsonsTest/conceptIdsTest.txt', {encoding:'utf8'}) // Array of concept Ids (string) (Note: purpose of the string array of strings '['...','...',....]'
    }


    let conceptIdList = JSON.parse(idIndex) // Array of concept Ids (list of string concepts)
    let varLabelIndex = 0; // Reassigns to the index location of Question Text
    let cluster = [] // gets reassigned

    /*------------------------------------------------------------ CHECKPOINT 1 ------------------------------------------------------------ */

    const fileStream = fs.createReadStream(fileName); // opens up file/stream and read data (all of it!)

    // console.log("fileStream",typeof fileStream)

    // fileStream.on('data',(chunk) => {
    //     console.log("chunk",typeof chunk.toString())
    //     console.log("chunk",chunk.toString())
    // })

    
    /* START COMMENT HERE */
    const outFile = 'prelude1Concept1.csv'
    let excelOutput = [] // [ [ [] ] ]; array nested 2 layers
    const rl = readline.createInterface({ // readline - interface for reading data from a readable stream
        input: fileStream,
        crlfDelay: Infinity // crlfDelay - recognize all instances of CR LF from fileStream as a single line break
    })

    let first = true;
    let second  = true;
    let currCluster = false;
    let header = [];
    let conceptCols = []; // concept Columns will be here, list of column index numbers
    let conceptIdObject = {}; // if exists () --> { '2': 'Primary Source','4': 'Secondary Source','6': 'Source Question','9': 'Question Text','16': 'Format/Value'}
    let nameToConcept = JSON.parse(ConceptIndex); // varToConcept Library 
    

    // rl.on('line', (input) => {
    //     console.log(typeof `${input}`, input);
    // });

    let numCounter = 0
    for await(const line of rl){ // handle promise based value --> each line from rl will be read as a single line
        // CSVToArray(',') extra paramater not needed
        // console.log("line",typeof line,line)
        let arr = CSVToArray(line, ',') // Each arr --> current line of text items separated by comma 
        /* Current arr row and iteration count */
        // console.log("arr", numCounter, arr) 
/*------------------------------------------------------------ (CHECKPOINT 2 - Looping through curremt row array, push to cluster array )------------------------------------------------------------ */
        if(first){ // populates header array variable; assigns index val of question text header (first row) to varLabelIndex variable
            conceptIdObject = getConceptIdCols(arr)
            // console.log('abc')
            // console.log("conceptIdObject",conceptIdObject)
            header = arr; // array of string items
            // console.log("header",header)
            first = false; // reassign, only used for top header
            for(let i = 0; i < arr.length; i++){
                // NOTE: Add conditional for columns for v1 and v2 conceptIds???
                if(arr[i] == "Question Text"){
                    varLabelIndex = i; // reassign varLabelIndex with index of Question Text!
                    // console.log("varLabelIndex" , i)
                }
                if(arr[i] == "conceptId" && i+1 < arr.length){ // arr loop length control 
                    conceptCols.push(i+1) // push all conceptCols
                }
            }
            console.log("conceptCols" , conceptCols)
            // console.log("arr",arr)
            excelOutput.push([arr]) // an array within an array geting pushed to an array
            // console.log("excelOutput", excelOutput)
        }
        else if(currCluster){ // conditional for the rows 3 and onwards; third path after 2 rows go through conditional flow
            // console.log("numCounter elseif currCuster", numCounter, currCluster)
            // console.log("currCluster!, arr, varLabelIndex",currCluster, arr, "questionText/ varLabel Index ",varLabelIndex)
            if(arr[varLabelIndex] == ''){ // (empty question text) cell path, push curr row arr 
                // console.log('numCounter cluster', numCounter,arr) // leave for testing rows
                // console.log('arr[varLabelIndex]', varLabelIndex, arr[varLabelIndex], numCounter)
                cluster.push(arr); // appending to cluster the arrays with Qtext value
                // console.log("cluster after arr empty question Text if block",numCounter, cluster)
            }
            else{ // If question Text in current Row from arr (CSVToArray function return) HAS value
                // console.log("cluster", numCounter, cluster)
                // console.log("header", header)
                // console.log("nameToConcept",typeof nameToConcept, nameToConcept)
                // console.log("varLabelIndex",typeof varLabelIndex, varLabelIndex)
                // console.log("conceptIdList",typeof conceptIdList, conceptIdList)
                // console.log("conceptIdObject", typeof conceptIdObject,conceptIdObject )
                // console.log("sourceJSONS",typeof sourceJSONS, sourceJSONS )
                // console.log("jsonList",typeof jsonList, jsonList )
                // console.log('arr[varLabelIndex]', varLabelIndex, arr[varLabelIndex], numCounter) 
                // console.log("cluster after arr", numCounter, cluster)
                /* varLabelIndex is question Text index value (10)  */
                // next arr has previous cluster as cluster parameter, iteration 5 has cluster of lines 2,3,4 (Given no question text in lines 3 or 4 ) in masterFileCopy
                let returned = processCluster(cluster, header, nameToConcept, varLabelIndex, conceptIdList, conceptIdObject, sourceJSONS, jsonList, /[0-9]+\s*=/, numCounter)
                excelOutput.push(returned) // push to excelOutput (Main array of rows)
                cluster = [arr] // reassign empty array with current row line arr (to be used in processCluster)
                // console.log("cluster after arr", numCounter, cluster)
                currCluster = true;
            }
        }
        else{ // row after header switches currCluster boolean state
            // console.log("numCounter else currCuster", numCounter, currCluster)
            // console.log("cluster push arr", numCounter,arr)
            cluster.push(arr)
            currCluster = true;
            // console.log("cluster", cluster)
        }
        numCounter++
        // console.log(cluster)
    }
    // // GO TO processCluster
    // let returned = processCluster(cluster, header, nameToConcept, varLabelIndex, conceptIdList, conceptIdObject, sourceJSONS, jsonList,/[0-9]+\s*=/);
    // excelOutput.push(returned)
    // //console.log(sourceJSONS)
    // for(let i = 0; i < sourceJSONS.length; i++){
    //     let found = false;
    //     let result = {};
    //     for(let j = 0; j < jsonList.length; j++){
    //         let currJ = jsonList[j];
    //         let currS = sourceJSONS[i];
    //         if(currJ.conceptId == currS.conceptId){
                
    //             let key;

    //             for (key in currS) {
    //                 if(currS.hasOwnProperty(key)){
    //                     result[key] = currS[key];
    //                 }
    //             }

    //             for (key in currJ) {
    //                 if(currJ.hasOwnProperty(key)){
    //                     result[key] = currJ[key];
                        
    //                 }
    //             }
    //             if(currJ.conceptId == "289664241"){
    //                 //console.log(result)
    //             }
    //             found = true;
    //             jsonList[j] = result
    //         }
    //     }   
    //     if(!found){
    //         jsonList.push(sourceJSONS[i])
    //         fs.writeFileSync('./jsons/' + sourceJSONS[i]['conceptId'] + '.json', JSON.stringify(sourceJSONS[i],null, 2));

    //     }
    //     else{
    //         fs.writeFileSync('./jsons/' + sourceJSONS[i]['conceptId'] + '.json', JSON.stringify(result,null, 2))
    //     }
        
    // }
    // fs.writeFileSync('./jsons/varToConcept.json', JSON.stringify(nameToConcept))
    // fs.writeFileSync('./jsons/conceptIds.txt', JSON.stringify(conceptIdList))
    // rl.close();
    // fileStream.close();
    // let toPrint = '';
    // for(let i=0; i < excelOutput.length; i++){
    //     let cluster = excelOutput[i]
    //     for(let j = 0; j < cluster.length; j++){
    //         let row = cluster[j]
    //         toPrint += cluster[j].map(function(value){
    //             if(value.indexOf(',') != -1){
    //                 return "\"" + value + "\"";
    //             }
    //             else{
    //                 return value;
    //             }
    //         }).join(",");
    //         if(i!=excelOutput.length-1 || j!=cluster.length -1){
    //             toPrint += '\n'
    //         }
    //     }
    // }
    // fs.writeFileSync(fileName, toPrint)
    // let timestamp = new Date().toISOString().split('.')[0].replace(/:/g, '-').replace('T', '-');
    // let filenameOutside = './csvHistory/Quest-' + timestamp + '_Concept_Id_Dict.csv';
    // let filenameVarGen = './csvHistory/Quest-' + timestamp + '_Concept_ID_Gen.json'
    // fs.writeFileSync(filenameVarGen,JSON.stringify(nameToConcept,null, 2))
    // fs.writeFileSync(filenameOutside,toPrint)
    
    /* END COMMENT HERE */
}

module.exports = {
    readFile:readFile
}

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

function generateNine(){
    let a = ''
    a += Math.floor(Math.random()*9 + 1)
    for(let i = 1; i < 9; i++){
        let b = Math.floor(Math.random()*10)
        a += b
    }
    return a;
}

function generateRandomUUID(conceptIdList){
    //return uuidv4();
    let num = generateNine()
    while(!conceptIdList.includes(num)){
        let num = generateNine();
        return num;
    }
}

function processCluster(cluster, header, nameToConcept, indexVariableName, conceptIdList, conceptIdObject, sourceJSONS, jsonList){
    let nonEmpty = [];
    let list = [1,2,3]
    let conceptIdObjectKeys =Object.keys(conceptIdObject)
    let conceptIdIndices = [];
    let generalId = -1;
    let conceptIdReverseLookup = {};
    for(let i = 0; i < conceptIdObjectKeys.length; i++){
        conceptIdIndices.push(parseInt(conceptIdObjectKeys[i]))
        conceptIdReverseLookup[conceptIdObject[conceptIdObjectKeys[i]]] = parseInt(conceptIdObjectKeys[i])
    }

    for(let i = 1; i < cluster.length; i++){
        let currArr = cluster[i]
        for(let j = 0; j < currArr.length; j++){
            if(currArr[j].trim()!='' && !conceptIdIndices.includes(j)){
                if(!nonEmpty.includes(j)){
                    nonEmpty.push(j)
                }
            }
        }
    }
    
    let firstRowJSON = {}
    let firstRow = cluster[0]
    let clump = [];
    for(let i = 0; i < firstRow.length; i++){
        if((firstRow[i] != "" && !nonEmpty.includes(i) && !conceptIdIndices.includes(i)) || (conceptIdIndices.includes(i) && conceptIdObject[i] =="thisRowId")){
            firstRowJSON[header[i]] = firstRow[i]
        }
    }

    if(!firstRowJSON.hasOwnProperty('conceptId') || firstRowJSON['conceptId'] == ''){
        if(nameToConcept.hasOwnProperty(firstRow[indexVariableName])){
            firstRowJSON['conceptId'] = nameToConcept[firstRow[indexVariableName]]
            if(!conceptIdList.includes(firstRowJSON['conceptId'])){
                conceptIdList.push(firstRowJSON['conceptId'])
            }
            
        }
        else{
             firstRowJSON['conceptId'] = generateRandomUUID(conceptIdList);
             conceptIdList.push(firstRowJSON['conceptId'])
             nameToConcept[firstRow[indexVariableName]] = firstRowJSON['conceptId']
        }
    }
    firstRow[conceptIdReverseLookup['thisRowId']] = firstRowJSON['conceptId']
    
    //find sources first
    let conceptColNames = Object.keys(conceptIdReverseLookup)
    for(let i = 0; i < conceptColNames.length; i++){
        if(conceptColNames[i].indexOf('Source') != -1 && firstRow[conceptIdReverseLookup[conceptColNames[i]] + 1] != ''){
            let currId = firstRow[conceptIdReverseLookup[conceptColNames[i]]]
            
            let currVarName = firstRow[conceptIdReverseLookup[conceptColNames[i]] + 1]
            
            if(currId == '' && nameToConcept.hasOwnProperty(currVarName)){
                currId = nameToConcept[currVarName]
            }

            let found = -1;
            for(let j = 0; j < sourceJSONS.length; j++){
                let currJSON = sourceJSONS[j];
                if(currId != '' && currJSON['conceptId'] == currId){
                    found = i;
                    if(!currJSON['subcollections'].includes(firstRowJSON['conceptId'] + '.json')){
                        currJSON['subcollections'].push("https://github.com/episphere/conceptGithubActions/blob/master/jsons/" + firstRowJSON['conceptId'] + '.json')
                    }
                    j = sourceJSONS.length;
                }
                else if(currId == '' && currVarName == currJSON['Variable Name']){
                    found = i;
                    currId = currJSON['conceptId'];
                    if(!currJSON['subcollections'].includes("https://github.com/episphere/conceptGithubActions/blob/master/jsons/" + firstRowJSON['conceptId'] + '.json')){
                        currJSON['subcollections'].push("https://github.com/episphere/conceptGithubActions/blob/master/jsons/" + firstRowJSON['conceptId'] + '.json')
                    }
                    j = sourceJSONS.length
                }
            }
            if(found == -1){
                let newJSON = {}
                if(currId == '' ){
                    currId = generateRandomUUID(conceptIdList);
                }
                
                newJSON['conceptId'] = currId;
                newJSON['Variable Name'] = currVarName;
                newJSON['subcollections'] = ["https://github.com/episphere/conceptGithubActions/blob/master/jsons/" + firstRowJSON['conceptId'] + '.json']
                sourceJSONS.push(newJSON)
            }
            nameToConcept[currVarName] = currId
            if(!conceptIdList.includes(currId)){
                conceptIdList.push(currId)
            }
            
            firstRowJSON[header[conceptIdReverseLookup[conceptColNames[i]] + 1]] = "https://github.com/episphere/conceptGithubActions/blob/master/jsons/" + currId + '.json'
            firstRow[conceptIdReverseLookup[conceptColNames[i]]] = currId;
        }
    }

    let collections = [];
    let collectionIds = [];
    let leaves = []
    let leafIndex = -1;
    let leafObj = {}
    for(let i = 0; i < cluster.length; i++){
        let ids = [];
        let currCollection = {}
        let leaf = ''
        let currRow = cluster[i];
        for(let j = 0; j < nonEmpty.length; j++){
            let currObject = {} 
            
            let nonEmptyIndex = nonEmpty[j];

            
            let currValue = currRow[nonEmptyIndex]
            
           
            if(currValue.indexOf('=') != -1){
                leaf = currValue;
                leafIndex = nonEmptyIndex;
                leaves.push(currValue)
                let val = leaf.split('=')[1].trim()
                let key = leaf.split('=')[0].trim()
                let cid = generateRandomUUID(conceptIdList)
                if(nameToConcept.hasOwnProperty(val)){
                    cid = nameToConcept[val]
                }
                if(currRow[leafIndex - 1] != ''){
                    cid = currRow[leafIndex-1];
                }
                
                //fs.writeFileSync(cid + '.json', JSON.stringify({'conceptId':cid, 'variableName':val}));
                jsonList.push({'conceptId':cid, 'Variable Name':val})
                fs.writeFileSync('./jsons/' + cid + '.json', JSON.stringify({'conceptId':cid, 'variableName':val},null, 2))
                nameToConcept[val] = cid
                
                if(!conceptIdList.includes(cid)){
                    conceptIdList.push(cid)
                }
                leafObj[cid + '.json'] = key
                currRow[leafIndex-1] = cid
            }
            
            else{
                if(currRow[nonEmptyIndex] != ''){
                    currCollection[header[nonEmptyIndex]] = currRow[nonEmptyIndex]
                }
            }
            
        }
        if(conceptIdReverseLookup.hasOwnProperty('leftMostId') && currRow[conceptIdReverseLookup['leftMostId']] != ''){
            currCollection['conceptId'] = currRow[conceptIdReverseLookup['leftMostId']]
        }
        if(Object.keys(currCollection).length != 0){
            
            let cid = generateRandomUUID(conceptIdList)
            let objKeys = Object.keys(currCollection);
            for(let i = 0; i < objKeys.length; i++){
                let key = objKeys[i];
                if(nameToConcept.hasOwnProperty(currCollection[key])){
                    cid = nameToConcept[currCollection[key]]
                }
            }
            
            if(currCollection.hasOwnProperty('conceptId')){
                cid = currCollection['conceptId'];
            }
            if(!conceptIdList.includes(cid)){
                conceptIdList.push(cid);
            }
            currCollection['conceptId'] = cid;
            collectionIds.push("https://github.com/episphere/conceptGithubActions/blob/master/jsons/" + cid + '.json')
            for(let i = 0; i < objKeys.length; i++){
                let key = objKeys[i]
                nameToConcept[currCollection[key]] = cid;
            }
            collections.push(currCollection);
            cluster[i][conceptIdReverseLookup['leftMostId']] = cid;
            
            //fs.writeFileSync(cid + '.json', currCollection);
        }   
    }

    if(collections.length == 0  && leaves.length > 0){
        firstRowJSON[header[leafIndex]] = leafObj;
    }
    else{
        if(collectionIds.length != 0){
            firstRowJSON['subcollection'] = collectionIds;
        }
        for(let i = 0; i < collections.length; i++){
            let currCollection = collections[i]
            currCollection[header[leafIndex]] = leafObj;
            //fs.writeFileSync(currCollection['conceptId']+ '.json', JSON.stringify(currCollection));
            jsonList.push(currCollection)
            fs.writeFileSync('./jsons/' + currCollection['conceptId'] + '.json', JSON.stringify(currCollection,null, 2))

        }
    }
    
    if(cluster[0][conceptIdReverseLookup['thisRowId']] == ''){

        firstRowJSON['conceptId'] = generateRandomUUID(conceptIdList);
        if(nameToConcept.hasOwnProperty(firstRowJSON[header[indexVariableName]])){
            firstRowJSON['conceptId'] = nameToConcept[firstRowJSON[header[indexVariableName]]];
        }
        cluster[0][conceptIdReverseLookup['thisRowId']] = firstRowJSON['conceptId']
        nameToConcept[firstRowJSON[header[indexVariableName]]] = firstRowJSON['conceptId']
    }
    else{
        firstRowJSON['conceptId'] = cluster[0][conceptIdReverseLookup['thisRowId']]
        nameToConcept[firstRowJSON[header[indexVariableName]]] = firstRowJSON['conceptId']
    }
    jsonList.push(firstRowJSON);
    fs.writeFileSync('./jsons/' + firstRowJSON['conceptId'] + '.json', JSON.stringify(firstRowJSON,null, 2))
    return cluster;

}

function CSVToArray(strData){
    strData = strData.trim();
    let arr = [];
    while(strData.indexOf(",") != -1 ){
        let toPush = "";
        if(strData.substring(0,1) == "\""){
            strData = strData.substring(1);
            toPush = strData.substring(0,  strData.indexOf("\""));    
            strData = strData.substring(strData.indexOf("\"") + 1);    
            strData = strData.substring(strData.indexOf(',')+1)
        }
        else{
            toPush = strData.substring(0, strData.indexOf(','));
            strData = strData.substring(strData.indexOf(',') + 1)
        }
        arr.push(toPush)

        //let nextQuote = strData.indexOf("\"")
    }
    arr.push(strData);

    // Return the parsed data.
    return( arr );
}

function lookForConcepts(cluster, header, idsToInsert, leftMost){
    let leafIndex = -1;
    let nonEmpty = [];
    for(let i = 1; i < cluster.length; i++){
        let currArr = cluster[i]
        for(let j = 0; j < currArr.length; j++){
            if(currArr[j]!=''){
                if(!nonEmpty.includes(j)){
                    nonEmpty.push(j)
                }
                if(currArr[j].indexOf('=') != -1){
                    if(!idsToInsert.includes(j)){
                        idsToInsert.push(j)    
                    }
                    if(leafIndex == -1){
                        leafIndex = j
                    }
                   
                }
            }
        }
    }
    for(let i = 0; i < nonEmpty.length; i++){
        if(nonEmpty[i] != leafIndex && nonEmpty[i] < leftMost[0] && header[nonEmpty[i]] != 'conceptId'){
            leftMost[0] = nonEmpty[i];
            leftMost[1] = header[nonEmpty[i]]
        }
    }

    //identify which one is the leaf

}

async function getConceptIds(fileName){
    const fileStream = fs.createReadStream(fileName);
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })
    //first, get all columns that require conceptids
    //next, check if column to the right has concept id
    //if it does, add to array, if it doesnt, maybe add to file
    //keywords: source
    //Look for columns with clusters
    let varLabelIndex = 0;
    let cluster = []
    let first = true;
    let currCluster = false;
    let header = [];
    let idsToInsert = [];
    let idsFound = []
    let conceptIdIndices = []
    let leftMost = []
    let firstNotSource = -1;
    let leftMostStart = -1;

    for await(const line of rl){
        let arr = CSVToArray(line, ',')
        if(first){
            header = arr;
            first = false;
            for(let i = 0; i < arr.length; i++){
                if(arr[i] == "Variable Name"){
                    varLabelIndex = i;
                }
                if(arr[i].indexOf('Source') != -1){
                    idsToInsert.push(i)
                }
                else if(arr[i].indexOf('conceptId') != -1){
                    conceptIdIndices.push(i)
                    idsFound.push(arr[i])
                }
                else{
                    if(firstNotSource == -1 && arr[i] != ''){
                        idsToInsert.push(i)
                        firstNotSource = i
                    }
                }
                
            }
            leftMost.push(arr.length)
            leftMostStart = arr.length
            leftMost.push('')
        }
        else if(currCluster){
            if(arr[varLabelIndex] == ''){
                cluster.push(arr);
            }
            else{
                lookForConcepts(cluster, header, idsToInsert, leftMost)
            }
        }
        else{
            cluster.push(arr)
            currCluster = true;
        }
    }
    lookForConcepts(cluster, header, idsToInsert, leftMost);
    rl.close()
    fileStream.close()
    if(!idsToInsert.includes(leftMost[0]) && leftMost[0] != leftMostStart){
        
        idsToInsert.push(leftMost[0])
    }
    let nonIntersects = []
    for(let i = 0; i < idsToInsert.length; i++){
        let found = false;
        for(let j = 0; j < conceptIdIndices.length; j++){
            if(idsToInsert[i] == conceptIdIndices[j] + 1){
                found = true;
            }
        }
        if(found == false){
            nonIntersects.push(idsToInsert[i])
        }
    }

    //sorts in descending order
    nonIntersects.sort(function(a, b){return b - a})

    const fileStream2 = fs.createReadStream(fileName); 
    const rl2 = readline.createInterface({
        input: fileStream2,
        crlfDelay: Infinity
    })
    let toWrite ='';
    first = true;
    let finalConceptIndices = {};
    for await(const line of rl2){
        let arr = CSVToArray(line, ',')
        if(first == true){
            let general = arr[firstNotSource]
            for(let i = 0; i < nonIntersects.length; i++){
                arr.splice(nonIntersects[i],0,'conceptId')
            }

            toWrite += arr.map(function(value){
                if(value.indexOf(',') != -1){
                    return "\"" + value + "\"";
                }
                else{
                    return value;
                }
            }).join(",");
            first = false;
            for(let i = 0; i < arr.length; i++){
                if(arr[i].includes('conceptId') && i != arr.length - 1){
                    if(arr[i+1] == general){
                        finalConceptIndices[i] = 'thisRowId'
                    }
                    else if(arr[i+1] == leftMost[1]){
                        finalConceptIndices[i] = 'leftMostId'
                    }
                    else{
                        finalConceptIndices[i] = arr[i+1]
                    }
                }
            }
        }   
        else{
            for(let i = 0; i < nonIntersects.length; i++){
                arr.splice(nonIntersects[i],0,'')
            }
            toWrite += '\n'
            toWrite += arr.map(function(value){
                if(value.indexOf(',') != -1){
                    return "\"" + value + "\"";
                }
                else{
                    return value;
                }
            }).join(",");
        }
    }
    rl2.close()
    fileStream2.close()
    fs.writeFileSync(fileName, toWrite)
    return finalConceptIndices;
}

async function readFile(fileName){
    let jsonList = []
    let sourceJSONS = []
    fs.readdirSync('./jsons/').forEach(file => {
        /*if(file.match(/[0-9]{9}.json/)){
            let currFileContents = fs.readFileSync('./jsons/' + file);
            let currJSON = JSON.parse(currFileContents)
            sourceJSONS.push(currJSON);
        }*/
    });
    let ConceptIndex = '{}'
    if(fs.existsSync('./jsons/varToConcept.json')){
        ConceptIndex = fs.readFileSync('./jsons/varToConcept.json', {encoding:'utf8'})
    }
    let idIndex = '[]'
    if(fs.existsSync('./jsons/conceptIds.txt')){
        idIndex = fs.readFileSync('./jsons/conceptIds.txt', {encoding:'utf8'})
    }
    let conceptIdList = JSON.parse(idIndex)
    let varLabelIndex = 0;
    let cluster = []
    let conceptIdObject = await getConceptIds(fileName)
    
    const fileStream = fs.createReadStream(fileName);
    const outFile = 'prelude1Concept1.csv'
    let excelOutput = []
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })
    let first = true;
    let currCluster = false;
    let header = [];
    let nameToConcept = JSON.parse(ConceptIndex);
    for await(const line of rl){
        //let arr = line.split(',');
        let arr = CSVToArray(line, ',')
        if(first){
            header = arr;
            first = false;
            for(let i = 0; i < arr.length; i++){
                if(arr[i] == "Variable Name"){
                    varLabelIndex = i;
                }
            }
            excelOutput.push([arr])
        }
        else if(currCluster){
            if(arr[varLabelIndex] == ''){
                cluster.push(arr);
            }
            else{
                let returned = processCluster(cluster, header, nameToConcept, varLabelIndex, conceptIdList, conceptIdObject, sourceJSONS, jsonList)
                excelOutput.push(returned)
                cluster = [arr]
                currCluster = true;
            }
        }
        else{
            cluster.push(arr)
            currCluster = true;
        }
    }
    let returned = processCluster(cluster, header, nameToConcept, varLabelIndex, conceptIdList, conceptIdObject, sourceJSONS, jsonList);
    excelOutput.push(returned)
    for(let i = 0; i < sourceJSONS.length; i++){
        jsonList.push(sourceJSONS[i])
        fs.writeFileSync('./jsons/' + sourceJSONS[i]['conceptId'] + '.json', JSON.stringify(sourceJSONS[i],null, 2));
    }
    fs.writeFileSync('./jsons/varToConcept.json', JSON.stringify(nameToConcept))
    fs.writeFileSync('./jsons/conceptIds.txt', JSON.stringify(conceptIdList))
    rl.close();
    fileStream.close();
    let toPrint = '';
    for(let i=0; i < excelOutput.length; i++){
        let cluster = excelOutput[i]
        for(let j = 0; j < cluster.length; j++){
            let row = cluster[j]
            toPrint += cluster[j].map(function(value){
                if(value.indexOf(',') != -1){
                    return "\"" + value + "\"";
                }
                else{
                    return value;
                }
            }).join(",");
            if(i!=excelOutput.length-1 || j!=cluster.length -1){
                toPrint += '\n'
            }
        }
    }
    fs.writeFileSync(fileName, toPrint)
    
}

module.exports = {
    readFile:readFile
}

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

function processCluster(arr, header, conceptIdList, sourceJSONS, jsonList, fileName){

    let thisRowJSON= {}
    
    for(let i = 0; i < arr.length; i++){
        if(arr[i] != "" && arr[i].substring(0,1) != '['){
            thisRowJSON[header[i]] = firstRow[i]
        }
        else{
            try{
                thisRowJSON[header[i]] = JSON.parse(firstRow[i])
            }catch(exception){
                console.log('there was an error parsing your array')
            }
        }
    }

    if(!thisRowJSON.hasOwnProperty('conceptId') || thisRowJSON['conceptId'] == ''){
        thisRowJSON['conceptId'] = generateRandomUUID(conceptIdList);
        conceptIdList.push(thisRowJSON['conceptId'])
    }
    thisRowJSON['@context'] = fileName

    arr[0] = thisRowJSON['conceptId']
    jsonList.push(thisRowJSON);
    fs.writeFileSync('./jsons/' + thisRowJSON['conceptId'] + '.json', JSON.stringify(thisRowJSON,null, 2))
    return arr;

}
function CSVToArray(strData){
    strData = strData.trim();
    let arr = [];
    let finalPush = true;
    while(strData.indexOf(",") != -1 ){
        let toPush = "";
        
        if(strData.substring(0,1) == "\""){
            strData = strData.substring(1);            
            let nextLook = strData.indexOf('\"\"')
            
            while(nextLook != -1){
                console.log(nextLook)
                toPush += strData.substring(0,nextLook) + '\"\"'
                strData = strData.substring(strData.indexOf("\"\"") + 2);    
                nextLook = strData.indexOf('\"\"')
            }

            toPush += strData.substring(0,  strData.indexOf("\""));    
            strData = strData.substring(strData.indexOf("\"") + 1);    
            strData = strData.substring(strData.indexOf(',')+1)
            if(strData.trim() == ''){
                finalPush = false
            }
        }
        else{
            toPush = strData.substring(0, strData.indexOf(','));
            strData = strData.substring(strData.indexOf(',') + 1)
        }
        arr.push(toPush)

        //let nextQuote = strData.indexOf("\"")
    }
    if(finalPush == true){
        arr.push(strData);
    }

    // Return the parsed data.
    return( arr );
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
    let idToInsert = 0;
    let idsFound = []
    let conceptIdIndices = []

    for await(const line of rl){
        let arr = CSVToArray(line, ',')
        if(first){
            header = arr;
            first = false;
            if(arr[0] == "conceptId"){
                idToInsert = 1
            }
        }
    }

    rl.close()
    fileStream.close()

    if(idToInsert == 0){
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
                
                arr.splice(0,0,'conceptId')

                toWrite += arr.map(function(value){
                    if(value.indexOf(',') != -1){
                        return "\"" + value + "\"";
                    }
                    else{
                        return value;
                    }
                }).join(",");
                first = false;
            }   
            else{
                arr.splice(0,0,'conceptId')
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
    }
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
    let idIndex = '[]'
    if(fs.existsSync('./jsons/conceptIds.txt')){
        idIndex = fs.readFileSync('./jsons/conceptIds.txt', {encoding:'utf8'})
    }
    let conceptIdList = JSON.parse(idIndex)
    let varLabelIndex = 0;
    let cluster = []
    await getConceptIds(fileName)
    
    const fileStream = fs.createReadStream(fileName);
    let excelOutput = []
    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    })
    let first = true;
    let header = [];
    for await(const line of rl){
        //let arr = line.split(',');
        let arr = CSVToArray(line, ',')
        if(first){
            header = arr;
            first = false;
            excelOutput.push([arr])
        }
        else{
            let returned = processCluster(arr, header, conceptIdList, sourceJSONS, jsonList, fileName)
            excelOutput.push(returned)
        }
    }
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

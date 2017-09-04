const fs    = require('fs')

global._files_s2m   = global._files_s2m || JSON.parse(fs.readFileSync(__dirname + '/db/s2m.json'))
global._files_s2mk  = global._files_s2mk || Object.keys(global._files_s2m)

global._files_msign = global._files_msign || 0
global._files_parsed_signs  = {}

// Paese a file sign
function parseSign(sign){
    if(!global._files_parsed_signs[sign]){
        let t   = sign.indexOf(',')
        let bo  = sign.substr(0, t)
        let hex = sign.substr(t + 1)

        global._files_parsed_signs[sign] = {
            bo      : parseInt(bo),
            buffer  : new Buffer(hex, 'hex')
        }

        delete t
        delete bo
        delete hex
    }
    return global._files_parsed_signs[sign]
}

// Find longest sign length
if(global._files_msign == 0){
    global._files_s2mk.map(x => {
        let sign    = parseSign(x)
        let len     = sign.bo + sign.buffer.length
        if(len > global._files_msign)
            global._files_msign = len
    })
}

function getFileMimes(filehead){
    let len     = filehead.length
    let signs   = global._files_s2mk.filter(x => {
        let {buffer, bo}    = parseSign(x)
        if(bo + buffer.length > len)
            return false
        for(let i = 0;i < buffer.length;i++){
            if(filehead[bo + i] != buffer[i])
                return false
        }
        return true
    })
    let re = []
    signs.map(x => {
        global._files_s2m[x].map(mime => {
            if(re.indexOf(mime) == -1)
                re.push(mime)
        })
    })
    return re
}

module.exports = {
    getFileMimes,
    maxLen: global._files_msign
}

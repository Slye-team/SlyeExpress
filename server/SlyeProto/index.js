const crypto    = require('crypto')
const AES       = require('aes-js')

function sha256(){
    return crypto.createHash('sha256').update(string).digest('hex');
}
modules.exports = function(__SlyeExpress__){
    return function SlyeProto(req, res, next){
        let {body}    = req
        if(!body['app.id'] || !body['data'])
            return res.status(403).send('403 Bad Endpoint Call.')
        let client  = __SlyeExpress__.__clients[appname]
        if(!client)
            return res.status(403).send('Client not allowed.')

        let iv  = (function(key){
            let time    = Date.now()
            // Convert timestamp from ms to s
            time    /= 1000
            // Consider each 5 min one time
            time    = Math.round(time / (5 * 60))
            // Make an 16 byte buffer
            let b = crypto.createHash('md5').update(key + ':' + time).digest()
            // Create result array
            let r = []
            for(let i = 0;i < 16;i++)
                r.push(b[i])
            return r
        })(client.getKey())

        let key = (function(key){
            let b = crypto.createHash('sha256').update(key).digest()
            let r = []
            for(let i = 0;i < 32;i++)
                r.push(b[i])
            return r
        })

        let encryptedBytes  = aesjs.utils.hex.toBytes(body.data)
        let aesCfb          = new aesjs.ModeOfOperation.cfb(key, iv)
        let decryptedBytes  = aesCfb.decrypt(encryptedBytes)
        let decryptedText   = aesjs.utils.utf8.fromBytes(decryptedBytes)
        let data

        try{
            data    = JSON.parse(decryptedText)
        }catch(e){
            return res.status(403).send('Invalid key/data format')
        }

        let oldSend = res.send
        res.send    = function(...args){
            try{
                args = args.map(x => {
                    let encryptedBytes  = aesCfb.encrypt(x)
                    // encrypted Hex
                    return aesjs.utils.hex.fromBytes(encryptedBytes)
                })
                return oldSend.apply(res, args)
            }catch(e){
                return undefined;
            }
        }

        req.slye        = {}
        req.slye.params = data
        // Set an alias
        req.slye.body   = req.slye.params
        req.slye.client = client
        next()
    }
}

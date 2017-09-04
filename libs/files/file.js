const crypto = require('crypto');
const minimatch = require("minimatch")

function md5(string){
    return crypto.createHash('md5').update(string).digest('hex');
}

module.exports  = function (__SlyeExpress__){
    async function File(id){
        let info = await __SlyeExpress__.redis.get('f:' + md5(id))
        if(!info)
            return false
        try{
            let obj = JSON.parse(info)
            obj.rm  = function(cb){
                __SlyeExpress__.__MulterStorage__._removeFile(null, obj, cb)
            }
            obj.mv  = function(newPath, cb){
                __SlyeExpress__.__MulterStorage__._moveFile(null, obj, newPath, cb)
            }
            obj.checkMime   = function(wildcard){
                return obj.mimes.filter(x => minimatch(x, wildcard)).length > 0
            }
            return obj
        }catch(e){
            return false
        }
    }
    File._register = function(info, cb){
        let data = JSON.stringify(info)
        crypto.randomBytes(256, (err, buf) => {
            if (err) return cb(err);
            let id = buf.toString('hex')
            __SlyeExpress__.redis.set('f:' + md5(id), data)
            cb(null, id)
        });
    }
}

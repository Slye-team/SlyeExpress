module.exports = function(__SlyeExpress__){
    return {
        storage:{
            disk: require('./storage/disk')
        },
        File: require('./files/file.js')(__SlyeExpress__),
        validate: require('./validate')
    }
}

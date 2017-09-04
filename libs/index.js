/**
 *    _____ __
 *   / ___// /_  _____
 *   \__ \/ / / / / _ \
 *  ___/ / / /_/ /  __/
 * /____/_/\__, /\___/
 *       /____/
 *       Copyright 2017 Slye Development Team. All Rights Reserved.
 *       Licence: MIT License
 */

module.exports = function(__SlyeExpress__){
    return {
        storage:{
            disk: require('./storage/disk')
        },
        File: require('./files/file.js')(__SlyeExpress__),
        validate: require('./validate')
    }
}

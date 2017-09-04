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

class CLIENT{
    constructor(id){
        this.__key          = ''
        this.__permissions  = []
        this.__isMaster     = false
        this.__id           = id
        this.permissions.master = function(){
            this.__isMaster = true
        }
    }
    key(key){
        this.__key  = key
        return this
    }
    permissions(...permissions){
        for(let i = 0;i < permissions.length;i++){
            if(typeof permissions[i] == 'string')
                this.__permissions.push(permissions[i].toLowerCase())
            else if(permissions[i].length)
                permissions(...permissions[i])
        }
        return this
    }
    check(permission){
        permission  = permission.toLowerCase()
        return this.__isMaster || this.__permissions.indexOf(permission) > -1
    }
    getKey(){
        return this.__key
    }
    getId(){
        return this.__id
    }
}

module.exports = CLIENT

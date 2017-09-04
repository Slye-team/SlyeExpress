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

function validate(form){
    return function(req, res, next){
        let params  = req.params;
        let _pr     = {}
        if(params.token)
            _pr.token   = params.token;

        let keys = Object.keys(form);
        let i = -1;
        function h(){
            i++;
            if(keys.length == i){
                req.params  = _pr;
                return next();
            }

            let key = keys[i]
            _pr[key]    = params[key];
            let functions   = [];
            function s(rule){
                if(typeof rule == 'string'){
                    let g = rule.split('|')
                    for(let j = 0;j < g.length;j++){
                        let f   = g[j];
                        let tmp   = f.indexOf(':')
                        tmp = tmp == -1 ? f.length : tmp;
                        let l = f.substr(0, tmp),
                            r = f.substr(tmp + 1)
                        r = r.length == 0 ? undefined : r;
                        if(!validate[l])
                            return res.send({code: 500, msg: "Error while parsing validation form."})
                        functions.push([validate[l], r, l]);
                    }
                }
                if(typeof rule == 'function'){
                    functions.push([rule])
                }
                if(typeof rule == 'object' && rule.length){
                    for(let j = 0;j < rule.length;j++){
                        s(rule[j])
                    }
                }
            }
            s(form[key]);

            let j = -1;
            function n(){
                j++;
                if(j == functions.length)
                    return h()
                cb =  (functions[j][0])(params[key], functions[j][1])
                if(cb && cb.then){
                    cb.then(function(r){
                        if(r){
                            n()
                        }else{
                            // invalide data
                            return res.send({code: 403, validation: key, 'function': functions[j][2]})
                        }
                    })
                }else {
                    if(cb){
                        n();
                    }else{
                        // invalide data
                        return res.send({code: 403, validation: key, 'function': functions[j][2]})
                    }
                }
            }
            n();
        }
        h();
    }
}

// validation functions

validate.required   = function(data){
    return  data !== undefined && (data.trim ? data.trim() !== '' : true);
}

validate.number     = function(data){
    data = parseInt(data)
    return !isNaN(data)
}

validate.username   = function(data){
    let re = new RegExp(/^[a-z_]\w{2,29}$/ig)
    return re.test(data);
}

validate.minlen = function(data, len){
    len = parseInt(len);
    return data.trim().length >= len;
}

validate.maxlen = function(data, len){
    len = parseInt(len);
    return data.trim().length <= len;
}

validate.email  = function(data){
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(data);
}

validate.md5    = function(data){
    let re = new RegExp(/^[a-f0-9]{32}$/ig)
    return re.test(data);
}

validate.sha256 = function(data){
    let re = new RegExp(/^[a-f0-9]{64}$/ig)
    return re.test(data);
}

validate.token  = function(data){
     let re = new RegExp(/^[a-f0-9]{64}$/ig);
    return validate.required(data) && re.test(data);
}

validate.object = function(data){
    return typeof data == 'object';
}

validate.hex    = function(data, len){
    len = parseInt(len)
    let re = new RegExp("^[a-f0-9]{" + len + "}$", 'ig')
    return re.test(data)
}

module.exports  = validate

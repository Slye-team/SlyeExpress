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

const SlyeProto = require('./SlyeProto')

/**
 * Serve application
 * @param  {number} __SlyeExpress__ Object containg all configs and etc...
 * @param  {[type]} port            Port to start server on
 */
function serve(__SlyeExpress__, port){
    const express   = require('express')
    const app       = express()
    const bodyParser= require('body-parser');
    const multer    = require('multer');
    const File      = require('../libs/files/file')(__SlyeExpress__)
    // parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: false }))
    // parse application/json
    app.use(bodyParser.json())


    /**
     * Register a new endpoint
     * Use this function to add your API endpoint
     * @param  {string} name        name of endpoint to be called
     * @param  {function} middlewares callback function of endpoint
     *  endpoint(name, function(req, res, next){}, function(req, res){})
     *  each middleware has three parameters:
     *  object req
     *  object res
     *  funciton next
     *  When we call an endpoint we start from the very first of one in the left
     *  and we pass a function to it as the third parameter (known as next)
     *  if you call this function we go to run the next middleware and so on...
     */
    __SlyeExpress__.endpoint    = function(name, ...middlewares){
        if(worker.id == 1)
            console.log('Registered endpoint:', name)
        if(!__SlyeExpress__.__endpoints)
            __SlyeExpress__.__endpoints  = {}
        __SlyeExpress__.__endpoints[name]   = middlewares
    }

    function loadEndpoints(){
        global.__SlyeExpress__  = __SlyeExpress__
        let files   = __SlyeExpress__.__files__endpoints
        for(let i = 0; i < files.length;i++){
            try{
                require(files[i])
            }catch(e){
                let err = 'Can not require file:' + files[i]
                throw new Error(err)
            }
        }
        delete global.__SlyeExpress__
    }

    function loadModels(){
        global.__SlyeExpress__  = __SlyeExpress__
        let files   = __SlyeExpress__.__files__models
        if(!__SlyeExpress__.models)
            __SlyeExpress__.models = {}
        for(let i = 0; i < files.length;i++){
            let model
            try{
                model = require(files[i])
            }catch(e){
                let err = 'Can not require file:' + files[i]
                throw new Error(err)
            }
            if(typeof model !== 'function'){
                let err = files[i] + ':Model file must export a class'
                throw new Error()
            }
            __SlyeExpress__.models[model.name] = model
        }
        delete global.__SlyeExpress__
    }

    // middleware to manage origin control
    app.use(function (req, res, next) {
        // Website you wish to allow to connect
        res.setHeader('Access-Control-Allow-Origin', __SlyeExpress__._ao || '*')

        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')

        // Request headers you wish to allow
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type')

        // Set to true if you need the website to include cookies in the requests sent
        // to the API (e.g. in case you use sessions)
        res.setHeader('Access-Control-Allow-Credentials', true)

        // Pass to next layer of middleware
        next()
    })

    // Middleware to set req.ip
    app.use(function(req, res, next){
        let nginx_header = __SlyeExpress__.nginx_header || 'X-Real-IP'
        req.ip  = req.headers[nginx_header]
            || req.headers['x-forwarded-for']
            || req.connection.remoteAddress)
        next()
    })

    app.post('/api', SlyeProto(__SlyeExpress__), function(req, res, next){
        let _endPoint   = __SlyeExpress__.__endpoints[req.slye.params.endpoint]
        if(!_endPoint || _endPoint.length == 0)
            return res.send({code: 404})
        let ip  = req.ip
        req     = req.slye
        req.ip  = ip
        let i   = -1
        function next(){
            i++
            if(!_endPoint[i])
                return
            if(typeof _endPoint[i] !== 'function')
                return next()
            _endPoint[i](req, res, next)
        }
        next()
    })


    if(__SlyeExpress__.__uploader_status__){
        let upload = multer({
            storage:  __SlyeExpress__.__MulterStorage__,
            limits: {
                fileSize: __SlyeExpress__.__uploader_max_size__
            }
        });

        app.post('/api/upload', upload.single('file'), function(req, res, next){
            File._register(req.file, (err, id) => {
                if(err)
                    return res.status(500).send(err)
                res.send(id)
            })
        })
    }

    app.all('*', function(req, res){
        res.status(404).send(404)
    })

    loadEndpoints()
    loadModels()

    function listen(port, max, min){
        if(port > max)
            return console.error(
                port == max ?
                `Can not listen on port ${port}` :
                `No free port between ${min}-${max}!
                Try run this app as super user`
            )
        try{
            app.listen(port, function(){
                console.log(`App started on port ${port}`)
            })
        }catch(e){
            port++
            listen(port, max, min)
        }
    }
    port = parseInt(port)
    let max = isNaN(port) ? 3150 : port
    port = isNaN(port) ? 3000 : port
    listen(port, max, port)
}
modules.exports = serve

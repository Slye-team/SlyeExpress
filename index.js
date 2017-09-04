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

// Import all required modules
const cluster   = require('cluster')
const glob      = require('glob')
const server    = require('./server')
const libs      = require('./libs') || {}
const CLIENT    = require('./libs/client')

// todo: comment this function
function extend(object, parent){
    let keys    = Object.getOwnPropertyNames(parent)
    for(let i = 0; i < keys.length;i++){
        if(!object.hasOwnProperty(keys[i]))
            object[keys[i]] = parent[keys[i]]
    }
    return object
}

/**
 * Use this function to create a new app
 * @return {object}
 * Available methods:
 *  loadEndpoints(pattern)
 *  loadModels(pattern)
 *  maxCPU(num)
 *  redis(redis)
 *  run(port)
 */
function createApp(){
    let __SlyeExpress__ = {
        __uploader_status__: false
    };

    function pushFiles(array, pattern){
        // Create array of file names
        if(!__SlyeExpress__[array])
            __SlyeExpress__[array]   = [];
        // Search for files using glob library
        let files = glob.sync(pattern)
        // Save result value as a variable
        let re = 0;
        // Push files to __SlyeExpress__[array]
        for(let i = 0;i < files.length;i++){
            let file = files[i]
            // Prevent overwrite one path multiple times
            // & add one to result when we push a something into list
            if(__SlyeExpress__[array].indexOf(file) == -1 && (++re))
                __SlyeExpress__[array].push(file)
        }
        return re
    }

    return extend({
        /**
         * Load a file containg one or more endpoints
         * @param  {string} pattern Glob pattern
         * @return {number} Number of new files added to endpoints array
         */
        loadEndpoints(pattern){
            return pushFiles('__files__endpoints', pattern)
        },
        /**
         * Load a model object
         * @param  {string} pattern Glob pattern
         * @return {number}         Number of new loaded models
         */
        loadModels(pattern){
            return pushFiles('__files__models', pattern)
        },
        /**
         * Set max number of CPU cores to use to launch this app
         * @param  {number} num Max number of CPU cores
         *                      zero means to use all system resources
         * @throw This function will throw an error when `num` is not a number
         */
        maxCPU(num){
            __SlyeExpress__.maxCPU = parseInt(num);
            if(isNaN(__SlyeExpress__.maxCPU)){
                let func = 'SlyeExpress.createApp().maxCPU(num)'
                let err  = `${func}: num must be a valid number, ${num} given.`
                throw new Error(err)
            }
            __SlyeExpress__.maxCPU  = num
        },
        /**
         * Set redis interface
         * @param  {redis}  redis Redis interface
         */
        redis(redis){
            __SlyeExpress__.redis   = redis
            redis.on('connect', function () {
                console.log("Connected to Redis")
            })
        },
        /**
         * Register a new variable so it can be used in all application scopes
         * sometimes you may want to set a configuration value using this method
         * @param {string} key   Variable name
         * @param {*} value Variable value
         */
        set(key, value){
            __SlyeExpress__[key] = value
        },
        mw(method){
            if(!__SlyeExpress__.__mw)
                __SlyeExpress__.__mw    = []
            __SlyeExpress__.__mw.push(method)
        },
        uploader:{
            disable(){
                __SlyeExpress__.__uploader_status__ = true
            },
            enable(){
                __SlyeExpress__.__uploader_status__ = false
            },
            maxSize(size){
                __SlyeExpress__.__uploader_max_size__ = size
            },
            storage(SEStorage){
                __SlyeExpress__.__MulterStorage__   = SEStorage
            },
        },
        allowOrigin(sites){
            __SlyeExpress__._ao = sites
        },
        client(appname){
            if(!__SlyeExpress__.__clients)
                __SlyeExpress__.__clients = {}
            __SlyeExpress__.__clients[appname]    = new CLIENT(appname)
            return __SlyeExpress__.__clients[appname]
        },
        /**
         * Run server
         * @param  {number} port Port to run server
         *  Default value is first open port starting from 3000
         */
        run(port){
            if (cluster.isMaster) {
                let startTimes  = {}
                console.log(`Master ${process.pid} is running`)

                // Count machine's CPUs
                let machineCPUs = require('os').cpus().length

                // Minimum of `machineCPUs` & `__SlyeExpress__.maxCPU` is what user
                // really wants (Think about it!)
                let cpuCount    = Math.min(machineCPUs, __SlyeExpress__.maxCPU || 0)

                // Zero means use all resources
                cpuCount = cpuCount == 0 ? machineCPUs : cpuCount

                // Create a worker for each CPU
                for (var i = 0; i < cpuCount; i += 1) {
                    cluster.fork()
                }

                cluster.on('listening', (worker) => {
                  startTimes[worker.process.pid]   = Date.now()
                });

                cluster.on('exit', (worker, code, signal) => {
                    let pid     = worker.process.pid
                    // Uptime in ms
                    let upTime = Date.now() - startTimes[pid]
                    if(runTime > 5000){
                        console.log(`worker ${pid} died, start it automatically`)
                        cluster.fork()
                    }else{
                        console.log(`worker ${pid} died immediately`)
                    }
                });
            } else {
                __SlyeExpress__.worker  = cluster.worker
                server(__SlyeExpress__, port)
                console.log(`Worker ${process.pid} started`)
            }
        }
    }, libs(__SlyeExpress__));

}

/**
 * Each SlyeExpress app has two main parts:
 *  a) Using `createApp` to create a new app
 *  b) Register a new Model or Endpoints in special scopes
 * and each of theme has it's own importing structure
 * (I know that's stupid but it really works!)
 *
 * To create an app use this structure:
 *  const app = require('SlyeExpress').createApp()
 *
 * Or when you need SlyeExpress API in your endpoints use this:
 *  const SlyeExpress =  require('SlyeExpress')()
 * Note: the last `()` is important!
 * Note: this import statement must be at file header
 *  (Or somewhere that runs instantly after importing with no delay)
 *
 * To understand how second one works imagine this code:
 *  function loadEndpoint(){
 *       global.__SlyeExpress__ = ...
 *       require('path to endpoint')
 *       delete global.__SlyeExpress__
 *  }
 * @constructor
 */
function SlyeExpress(){
    return extend(global.__SlyeExpress__, libs(global.__SlyeExpress__))
}
SlyeExpress.createApp = createApp

modules.exports = SlyeExpress

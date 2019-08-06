import {
    ping
} from './services'

const supportedAPI = ['init', 'test', 'createhederaobject', 'checktransaction', 'createcontractobject', 'readynesscheck']; // enlist all methods supported by API (e.g. `mw('event', 'user-login');`)
/**
 The main entry of the application
 */
const production = true;

function app(window) {
    console.log('HASH-JS starting');
    let configurations = {
        paymentserver: production ? "https://mps.hashingsystems.com" : 'http://localhost:9999',
        extensionid: "ligpaondaabclfigagcifobaelemiena",
        error: "/no-extension",
        type: "article",
        time: Date.now(),
        redirect: '{ "nonPayingAccount": "/insufficient-amount/", "noAccount": "/account-not-paired/", "homePage": "/"}',
        // this might make a good default id for the content
        id: window.location.pathname,
        submissionnode: "0.0.11",
        memo: Date.now(),
        recipientlist: '[{ "to": "0.0.99", "tinybars": "1666667" }]',
        contentid: '79',
        attrID: 'article-1',
        //redirect:'{ "nonPayingAccount": "/insufficient-amount/", "noAccount": "/account-not-paired/", "homePage": "/" }',
    };
    // all methods that were called till now and stored in queue
    // needs to be called now
    let globalObject = window[window['HASH-JS']];
    let queue = globalObject.q;
    if (queue) {
        for (var i = 0; i < queue.length; i++) {
            if (typeof queue[i][0] !== 'undefined' && queue[i][0].toLowerCase() == 'init') {
                configurations = extendObject(configurations, queue[i][1]);
                createHederaObject(configurations);
                console.log('HASH-JS started', configurations);
                checkForExtension(configurations)
            } else if (typeof queue[i][0] !== 'undefined' && queue[i][0].toLowerCase() == 'createcontractobject') {
                configurations = extendObject(configurations, queue[i][1]);
                apiHandler(configurations, queue[i][0], queue[i][1], queue[i][2]);
                checkForExtension(configurations)
            } else {
                let callback;
                if(typeof queue[i][1]=='function'){
                    callback = queue[i][1];
                }else{
                    callback = queue[i][queue.length - 1];
                }
                configurations = extendObject(configurations, queue[i][1]);
                apiHandler(configurations, queue[i][0], queue[i][1], callback);
            }
        }
    }
    // override temporary (until the app loaded) handler
    // for widget's API calls
    globalObject = apiHandler;
    globalObject.configurations = configurations;
}

function checkForExtension(configurations) {
    if (!isChrome()) {
        redirectToError('/isnotChrome');
    } else {
        let tags = configurations;
        // if tags.amount is null or undefined, we should assume that this is a free page and do nothing more
        if (tags.amount === null) return null;
        const EXTENSION_ID = tags.extensionid;

        detect(EXTENSION_ID, function () {
            redirectToError(tags.error);
        }, function (response) {
            console.log('detect: user has extension installed');
            recordResponse(response);
        });

        //console.log(chrome.runtime.connect(EXTENSION_ID,'version'));
        /*chrome.runtime.sendMessage(EXTENSION_ID, 'version', response => {
            console.log(response)
            return;
            if (!response) {
                redirectToError(tags.error);
            } else {
                recordResponse(response);
            }
        })*/
    }
}

function detect(extensionId, notInstalledCallback, installedCallback) {
    var img = new Image();
    img.onerror = notInstalledCallback;
    img.onload = installedCallback('installed');
    img.src = 'chrome-extension://' + extensionId + '/icons/icon16.png';
}

function recordResponse(res) {
    if (typeof res != 'undefined') {
        var body = document.getElementsByTagName('body');
        body.innerHTML += '<div style="width:100%;height:5%;opacity:0.3;z-index:100;background:yellow;">' + res + '</div>';
        return true;
    }
    return false;
}

function redirectToError(err) {
    if (window.location.pathname != err) {
        window.location.replace(window.origin + err);
    }
}

function isChrome() {
    return 'chrome' in window
}

/**
 Method that handles all API calls
 */
function apiHandler(configuration, api, params, callback = null) {
    if (!api) throw Error('API method required');
    api = api.toLowerCase();
    if (supportedAPI.indexOf(api) === -1) throw Error(`Method ${api} is not supported`);
    console.log(`Handling API call ${api}`, params);
    switch (api) {
        // TODO: add API implementation

        case 'createhederaobject':
            return createHederaObject(params);

        case 'checktransaction':
            return checkTransaction({configuration, params}, callback);

        case 'createcontractobject':
            return createContractObject({configuration, params}, callback);

        case 'readynesscheck':
            return readynessCheck(configuration, callback);

        case 'test':
            return params;
        default:
            console.warn(`No handler defined for ${api}`);
    }
}

function extendObject(a, b) {
    for (var key in b)
        if (b.hasOwnProperty(key)) a[key] = b[key];
    return a;
}

function createHederaObject(params) {
    let object = ['submissionnode', 'paymentserver', 'recipientlist', 'contentid', 'type', 'memo', 'extensionid', 'redirect', 'time'];
    let Hederaobject = '<hedera-micropayment ';
    for (var i in object) {
        let node = object[i];
        if (params.hasOwnProperty(node)) {
            Hederaobject += "data-" + node + "= '" + params[node] + "' , " + "\n";
        }
    }
    Hederaobject += '></hedera-micropayment>';
    var body = document.getElementById(params['attrID']);
    body.innerHTML += Hederaobject;
    return Hederaobject;
}

function createContractObject(params) {
    let __construct = ['contractid', 'maximum', 'paymentserver', 'params', 'memo', 'abi', 'redirect', 'extensionid'];
    let object = {
        contractid: '0.0.1111',
        maximum: '422342343',
        paymentserver: params.configuration.paymentserver,
        params: ["869", "100000000", "216", "253", "27", "0x226b08976ad0dd982aeb6b21a44f3eacae579569c34e71725aff801a2fe68739", "0x333f991fa3a870575f819569e9f72a771ea790078d448cc8789120ee14abf3c5"],
        memo: 'a4a7c4329aab4b1fac474ff6f93d858c',
        abi: JSON.stringify({
            "constant": false,
            "inputs": [{"name": "propertyID", "type": "uint24"}, {"name": "amount", "type": "uint256"}, {
                "name": "x",
                "type": "uint16"
            }, {"name": "y", "type": "uint16"}, {"name": "v", "type": "uint8"}, {
                "name": "r",
                "type": "bytes32"
            }, {"name": "s", "type": "bytes32"}],
            "name": "buyProperty",
            "outputs": [{"name": "", "type": "string"}],
            "payable": true,
            "stateMutability": "payable",
            "type": "function"
        }),
        redirect: '{"nonPayingAccount": "/insufficient-amount/","noAccount": "/account-not-paired","homePage": "/"}',
        extensionid: 'pdjjpcolgmmcifijpejkenpbbimedpic',
    };

    console.log(JSON.parse(object.abi));
    let extended = extendObject(object, params.params);
    console.log(extended);
    let Contractobject = '<hedera-contract ';
    for (var i in __construct) {
        let node = __construct[i];
        if (extended.hasOwnProperty(node)) {
            Contractobject += "data-" + node + "= '" + extended[node] + "' ";
        }
    }
    Contractobject += '></hedera-contract>';
    console.log(Contractobject);

    var body = document.getElementById(extended['attrID']);
    body.innerHTML += Contractobject;
    //console.log((Hederaobject))
    return Contractobject;
    //callback(Hederaobject);
}

function checkTransaction(params) {

    let memo_id = params.configuration.memo;
    let url = production ? "https://mps.hashingsystems.com" : 'http://localhost:9999';
    let structure = {
        baseurl: url,
        memo_id: memo_id,
        receiver_id: '',
        success: '/success',
        failure: '/payment-failed',
        timeout: 3000,
        limit: 1
    };

    for (var key in params.params) {
        if (params.params.hasOwnProperty(key) && params.params[key]) {
            structure[key] = params.params[key];
        }
    }

    if (structure.receiver_id && structure.memo_id) {
        URL = structure.baseurl + "/check/" + structure.receiver_id + "/" + structure.memo_id
    } else {
        URL = structure.baseurl + "/memo/" + structure.memo_id + '?limit=' + structure.limit;
    }
    console.log(structure.timeout);
    //setTimeout(performRequest(structure), structure.timeout)
    setTimeout(function () {
        performRequest(structure);
    }, structure.timeout);
}

var performRequest = function (structure) {
    console.log(structure)
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4) {
            if (this.status == 200) {
                let response = JSON.parse(this.response);
                console.log(response);
                console.log(response.response.length);
                if (response.response.length >= 1) {
                    /*window.open(
                        window.origin + structure.success,
                        '_blank'
                    );*/
                    window.location.replace(window.origin + structure.success);
                } else {
                    window.location.replace(window.origin + structure.failure);
                }
                //window.location.replace(window.origin + structure.success);
                //callback(null, this.response);
            } else {
                //callback({error: true, data: this.response}, null);
                window.location.replace(window.origin + structure.failure);
            }
        }
    };
    xhttp.open("GET", URL, true);
    xhttp.send();
};

function readynessCheck(params, callback) {
    let responese = {
        'ischrome': true,
        'accountPaired': false,
        'ismobile': null,
        'validBrowser': null,
        'extensionInstalled': null,
        'accessToAccounts': null,
        'accountId': null,
        'submissionNode': params.submissionnode
    };
    let checkIsChrome = isChrome();
    responese.ischrome = checkIsChrome;
    let mob = detectmob();
    responese.ismobile = mob;
    detect(params.extensionid, function () {
        responese.extensionInstalled = false;
        callback(null,responese);
    }, function () {
        responese.extensionInstalled = true;
        let object = createHederaObject(params);
        let url = production ? "https://mps.hashingsystems.com" : 'http://localhost:9999';
        URL = url + "/memo/" + params.memo;
        setTimeout(function () {
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4) {
                    if (this.status == 200) {
                        let ajaxresp = JSON.parse(this.response);
                        console.log(ajaxresp);
                        if(ajaxresp.response.length > 0){
                            responese.accountId = ajaxresp.response[0].sender;
                            responese.accountPaired = true;
                            responese.accessToAccounts = true;
                            callback(null,responese);
                        }else{
                            callback(responese);
                        }
                    } else {
                        responese.accountPaired = false;
                        responese.accessToAccounts = false;
                        callback(null,responese);
                    }
                }
            };
            xhttp.open("GET", URL, true);
            xhttp.send();
        },5000);
        //callback(null,responese);
    });

}

function detectmob() {
    if (navigator.userAgent.match(/Android/i)
        || navigator.userAgent.match(/webOS/i)
        || navigator.userAgent.match(/iPhone/i)
        || navigator.userAgent.match(/iPad/i)
        || navigator.userAgent.match(/iPod/i)
        || navigator.userAgent.match(/BlackBerry/i)
        || navigator.userAgent.match(/Windows Phone/i)
    ) {
        return true;
    } else {
        return false;
    }
}


app(window);


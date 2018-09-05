const express = require('express');
const app = express();
const mongo = require('mongodb');
const twig = require('twig');
twig.cache(false);
const cs = require('cookie-session');
const connection = mongo.connect('mongodb://127.0.0.1:27017', {useNewUrlParser: true});
const ObjectId = mongo.ObjectId;

app.use(cs({keys:['test', 'values']}));
app.use('/public/', express.static('public'));
app.use(express.urlencoded());
app.set('view engine', 'twig');

// class DB {
//     constructor(dbName, colName, client) {
//         this.dbName = dbName;
//         this.colName = colName;
//         this.client = client;
//     }
//     connectToDb() {
//         return this.client.db(this.dbName);
//     }
//     getCollection() {
//         return this.connectToDb().collection(this.colName);
//     }
// }

app.get('/userpage', function(req, resp) {    
    connection.then(onConnect
             ).then(onFound
             ).then(checkSessionId);
    
    function onConnect(client) {
        const db = client.db('users');
        const col = db.collection('userData');
        return col.find({"_id":ObjectId(req.session.currentActiveUser)});
    }

    function onFound(cursor) {        
        return cursor.toArray();
    }

    function checkSessionId(data) {        
        if(data.length) {
            resp.render('userpage', {username: data[0].username});
        } else {
            console.log('wrong id');      
            resp.redirect('/');
        }
    }
}); 

app.post('/userpage', function(req, resp) {    
    if(req.body.logout) {
        console.log('logged out');        
        req.session = null;
        resp.redirect('/');        
    }
});

app.get('/', function(req, resp){
    resp.render('login');    
});

app.post('/', function(req, resp) {
    connection.then(onConnect
             ).then(onFound
             ).then(checkUser
             ).catch(err);

    function onConnect(client) {
        const db = client.db('users');
        const col = db.collection('userData');

        return col.find({$and:[

            {"username": req.body.username}, 
            {"password": req.body.password}

            ]
        });
    }

    function onFound(cursor) {        
        return cursor.toArray();
    } 

    function checkUser(searchResult) {
        console.log(searchResult);
        
        if(searchResult.length) {
            req.session.currentActiveUser = searchResult[0]._id;
            resp.redirect('/userpage');
        } else {
            resp.redirect('/');
            console.log('user need to be created');            
        }      
    }    

    function err(err){
        console.log(err);                       
    }     
});

app.get('/createuser', function(req, resp) {
    resp.render('createuser');
});

app.post('/createuser', function(req, resp) {
    let data = {
        username: req.body.newUserName, 
        email: req.body.emailField, 
        password: req.body.newPassword
    };

    if (req.body.newPassword === req.body.newPasswordConfirm) {
        connection.then(onConnect
                 ).then(createUser
                 ).catch(err);

        function onConnect(client) {
            const db = client.db('users');
            const col = db.collection('userData');
            return col;
        };

        function createUser(col) {            
            col.insertOne(data);
            console.log("New user had been created");
            resp.redirect('/');
        };

        function err(err){
            console.log(err);                       
        };
    } else {
        console.log('Different passwords!');    
        resp.redirect('/createuser');
    }
     
});

app.listen(3000);



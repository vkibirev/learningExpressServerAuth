const express = require('express');
const app = express();
const mongo = require('mongodb');
const twig = require('twig');
twig.cache(false);
const cs = require('cookie-session');
const connection = mongo.connect('mongodb://127.0.0.1:27017', {useNewUrlParser: true});

app.use(cs({keys:['test', 'values']}));
app.use('/public/', express.static('public'));
app.use(express.urlencoded());
app.set('view engine', 'twig');

class DB {
    constructor(dbName, colName, client) {
        this.dbName = dbName;
        this.colName = colName;
        this.client = client;
    }
    connectToDb() {
        return this.client.db(this.dbName);
    }
    getCollection() {
        return this.connectToDb().collection(this.colName);
    }
}

app.get('/userpage', function(req, resp) {    
    connection.then(onConnect).then(onFound).then(checkSessionId);
    console.log(req.session.currentActiveUser);
    
    function onConnect(client) {
        const db = client.db('users');
        const col = db.collection('userData');
        return col.find({_id:{$eq:req.session.currentActiveUser}});
    }

    function onFound(cursor) {
        return cursor.toArray();
    }

    function checkSessionId(data) {
        if(data.length) {
            req.session.currentActiveUser = null;
            console.log('into ', req.session.currentActiveUser);
            resp.end('right id');
        } else {
            console.log('wrong id');            
            resp.redirect('/');
        }
    }
}); 

app.get('/', function(req, resp){
    resp.render('login');    
});

app.post('/', function(req, resp) {
    connection.then(writeUserDataToDB);

    function writeUserDataToDB(connection) {
        let data = {username: req.body.username, password: req.body.password};
        const db = new DB('users', 'userData', connection);        
        const userDataCollection = db.getCollection();
        
        userDataCollection.find({
            $and:[
                {username:{$eq:req.body.username}}, 
                {password:{$eq:req.body.password}}
            ]
                        }).toArray(            
                        ).then(checkUser
                        ).catch(err);

        function checkUser(cursor) { 
            if (cursor.length) {
                req.session.currentActiveUser = cursor[0]._id;      
                resp.redirect('/userpage');                
            } else {
                userDataCollection.insertOne(data);
                resp.redirect('/userpage');
            }                        
        }

        function err(err){
            console.log(err);            
        }        
    };
    
});

app.listen(3000);



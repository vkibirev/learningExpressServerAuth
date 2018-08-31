const express = require('express');
const app = express();
const mongo = require('mongodb');
const twig = require('twig');
twig.cache(false);
const cs = require('cookie-session');
const client = mongo.connect('mongodb://127.0.0.1:27017', {useNewUrlParser: true})

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

app.get('/', function(req, resp){
    resp.render('login');
});

app.post('/', function(req, resp) {
    client.then(writeUserDataToDB);

    function writeUserDataToDB(connection) {
        let data = {username: req.body.username, password: req.body.password};
        // let data = {username: 'test1', password: 'testPass1'};
        const db = new DB('users', 'userData', connection);        
        const userDataCollection = db.getCollection();
        console.log('1 layer ', data); //debug
        
        userDataCollection.find({username:{$eq:req.body.username}
                        }).toArray(            
                        ).then(checkUser
                        ).catch(err);

        function checkUser(cursor) { 
            console.log('2 layer ', data); //debug
            if (data.username === cursor[0].username) {
                console.log('2.1 layer ', data);    //debug             
                console.log('existing user!', cursor[0].username);   
            } else {
                console.log('2.2 layer ', data); //debug
                userDataCollection.insertOne(data);
            }                        
        }

        function err(err){
            console.log(err);            
        }        
    };   

    resp.redirect('/');
    
});

app.listen(3000);



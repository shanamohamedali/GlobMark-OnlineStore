const {MongoClient}=require("mongodb")
const state= {
    db:null
}

    const url='mongodb://127.0.0.1:27017' //connection string
    const dbName='globmark_shopping' //db name
    const client=new MongoClient(url) //create a new mongodb client obj

//funtn to establish mongodb connection
    const connect=async(cb)=>{
        try{
            await client.connect();  //connecting to mongodb
            const db=client.db(dbName); // settingup db name to connected client 
            state.db=db; //setting up db name to state
            return cb() // call back after connected
        }
        catch(err){
            return cb(err);
        }
    }

   const get=()=>state.db; // funtn to get db instance
   
// exporting funtns
module.exports={
    connect,
    get,
}
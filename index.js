const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express()
const uri = process.env.MONGODB_URI;
const port = process.env.PORT || 5000;
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}));

app.use(express.json());



app.get('/', (req, res) => {
  res.send('Hello User In RecipeHUB Server !')
})


// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});


// { Database collection created here }

const database = client.db("RecipyHubproject");
const recipesCollection = database.collection("recipes");
const paymentCollection = database.collection("payments");
const UserCollection = database.collection("user");
const favouriteCollection = database.collection("favourite");
const favouritecountCollection = database.collection("favouritecount");
const likecountCollection = database.collection("likescount");
const reportCollection = database.collection("reports");

// { Data Get API } 

app.get( '/api/payments' , async (req , res ) => {
  const result = await paymentCollection.find().toArray();
  res.send(result)
})

app.get('/api/favourite' , async ( req , res ) => {
  const {id , recipeid } = req.query ;
  let query = {};
  if(id){
    query = { userid : id }
  }
  if(recipeid){
    query = { recipeid : recipeid }
  }
  const result = await favouriteCollection.find(query).toArray() 
  res.send(result)
})



app.get('/api/likescount' , async ( req , res ) => {
  const { recipeid , authorEmail } = req.query ;
  let query = {};
 
  if(recipeid){
    query = { recipeid : recipeid }
  }

  if(authorEmail){
    query = { authorEmail: authorEmail}
  }
  const result = await likecountCollection.find(query).toArray() 
  res.send(result)
})


app.get('/api/report' , async (req , res ) => {
  const result =  await reportCollection.find().toArray()
  res.send(result)
})


app.get( '/api/user' , async (req , res ) =>{
  const result = await UserCollection.find().toArray()
  res.send(result)
})


app.get("/api/recipes", async (req, res) => {
  try {
    const { id , email  } = req.query;
    // console.log(email , id )
    let query = {};

    if (id) {
      query = { _id: new ObjectId(id) };
    }
    if(email) {
      query = { authorEmail : email}
    }

    const result = await recipesCollection.find(query).toArray();

    res.json(result);
  } catch (error) {
    console.error("GET error:", error); 
    res.status(500).send({ success: false, message: error.message });
  }
});
 

// { Data Delete API }

app.delete("/api/report/:id", async (req, res) => {
try{
 const id =  new ObjectId(req.params.id) 
  const result = await reportCollection.deleteOne({
    _id : id 
  })
  res.send(result)
 }
catch(error){
  res.status(500).send({ success: false, message: error.message });
}})




app.delete("/api/recipes/:id", async (req, res) => {
try{
 const id =  new ObjectId(req.params.id) 
  const result = await recipesCollection.deleteOne({
    _id : id 
  })
  res.send(result)
 }
catch(error){
  res.status(500).send({ success: false, message: error.message });
}})
 



// { Data Edit API }

app.patch('/api/recipes/:id', async (req, res) => {
  try {
    const id = new ObjectId(req.params.id)  ;
    const Data = req.body
    // console.log(Data)
    const newdata = {
      $set: {
            recipeName: Data.recipeName,
            recipeImage: Data.recipeImage,
    
            category :  Data.category ,
            cuisineType: Data.cuisineType,
            difficultyLevel: Data.difficultyLevel ,
            preparationTime: Data.preparationTime ,
            ingredients: Data.ingredients ,
            instructions: Data.instructions ,
             likesCount : 0 ,
            isFeatured: Data.isFeatured ,
            status : Data.status ,
            updatedAt : new Date()
      },
    };

    const result = await recipesCollection.updateOne(
      { _id :  id },
      newdata
    );

    res.json(result);
  } catch (error) {
    console.error("PATCH error:", error);
    res.status(500).send({ success: false, message: error.message });
  }
});



app.patch('/api/user/:email', async (req, res) => {
  try {
    const email = req.params.email;

    const newdata = {
      $set: {
        isPremium: req.body?.isPremium,
      },
    };

    const result = await UserCollection.updateOne(
      { email },
      newdata
    );

    res.json(result);
  } catch (error) {
    console.error("PATCH error:", error);
    res.status(500).send({ success: false, message: error.message });
  }
});



// { Data Post API }

app.post('/api/favourite' , async(req , res ) => {
  const Data = req.body 
  const NewData = {
    ... Data , updatedAt : new Date() 
  }
  const result = await favouriteCollection.insertOne(NewData)
  res.send(result)
})



app.post('/api/likescount' , async(req , res ) => {
  const Data = req.body 
  const NewData = {
    ... Data , updatedAt : new Date() 
  }
  const result = await likecountCollection.insertOne(NewData)
  res.send(result)
})


app.post('/api/report' , async(req , res ) => {
  const Data = req.body 
  const NewData = {
    ... Data , createdAt : new Date() 
  }
  const result = await reportCollection.insertOne(NewData)
  res.send(result)
})


app.post('/api/payments' , async(req , res ) => {
  const Data = req.body 
  const NewData = {
    ... Data , updatedAt : new Date() 
  }
  const result = await paymentCollection.insertOne(NewData)
  res.send(result)
})



app.post('/api/recipes' , async(req , res ) => {
  const Data = req.body 
  const NewData = {
    ... Data , createdAt : new Date() , updatedAt : new Date()
  }
  const result = await recipesCollection.insertOne(NewData)
  res.send(result)
})

async function run() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error(error);
  }
}

run();


app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
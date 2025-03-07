const express = require("express");
require("dotenv").config();

const { MongoClient, ServerApiVersion } = require("mongodb");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;

// MIDDLEWARE
app.use(cors());
app.use(express.json());

// MONGODB Connection

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.uomr8.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    // DATABASE+Collection
    const jobsCategory=client.db('JobPortalDB').collection('JobsBrowseCategoryCollection')
    const jobs=client.db('JobPortalDB').collection('JobsCollection')
    


    // ALL APIs here (jobsCategory collection)
   

    app.get('/jobCategories',async(req,res)=>{
        const cursor=jobsCategory.find()
        const result=await cursor.toArray()
        // console.log(result);
        res.send(result)
    })


     // ALL APIs here (jobsCategory collection)
     app.get('/hotJob/:category',async(req,res)=>{
      const category=req.params.category
      const query ={category:category}
      const cursor =jobs.find(query)
      const result=await cursor.toArray()

      res.send(result)
     })



    /*********************/ 

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// server APIs

app.get("/", (req, res) => {
  res.send("Job portal server is running...");
});

// Listen to post: MUST
app.listen(port, () => {
  console.log("Listening to port=>", port);
});

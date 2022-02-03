const express = require("express");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const sharp = require("sharp");

const auth = require("../middleware/auth");
//loading in model
const User = require("../models/user");
// loading in a function from account.js
const {sendWelcomeEmail, sendCancelEmail} = require('../emails/account')

const router = new express.Router();

// sign up
router.post("/users", async (req, res) => {
  // pass in the data coming from request, to a new instance of the user model
  const user = new User(req.body);
  // save the data and send back a response and status
  try {
    await user.save();

    sendWelcomeEmail(user.email, user.name)

    const token = await user.generateAuthToken();

    res.status(201).send({ user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

// log in user
router.post("/users/login", async (req, res) => {
  try {
    const user = await User.findByCredentials(
      req.body.email,
      req.body.password
    );

    // As we are not trying to create a token on the model, rather on an actual user itself (an object). So we dont call the 'User' but the 'user'
    const token = await user.generateAuthToken();

    // return an object containing both user and the token
    res.send({ user: user, token });
  } catch (error) {
    res.status(400).send(error);
  }
});

// log out
router.post("/users/logout", auth, async (req, res) => {
  try {
    // we need the token of the session the user currently logged out of. We dont want to log him out of every device. Just the one he is currently using and logging out of.
    // we extract the specific token they used when they authenticated from the auth middleware
    // matching our token with the token present in db and removing it to logout
    req.user.tokens = req.user.tokens.filter((token) => {
      // we check if our token is not equal to the one passed, if its not true we keep it in the array. If they are equal we filter it out and remove it.
      return token.token !== req.token;
    });

    await req.user.save();
    res.send("User Logged out");
  } catch (error) {
    res.status(500).send();
  }
});

// log out of all places
router.post("/users/logoutAll", auth, async (req, res) => {
  try {
    // storing an empty array in place of the tokens array in the db and saving th user
    req.user.tokens = [];

    await req.user.save();

    res.send("All users Logged out");
  } catch (error) {
    res.status(500).send();
  }
});

router.get("/users/me", auth, async (req, res) => {
  // a route that allows the user to see their own data.
  // we dont have to find the user by id as we already did that in the middleware function.
  // we have the user in our request coming from through the middleware so we can just send it to the client
  try {
    const user = req.user;
    res.send(user);
  } catch (error) {
    res.status(500).send();
  }
});

// // : is a way to make the url/api dynamic so we can replace whatever is next with a value we get from the database
// router.get('/users/:id', async (req, res) => {
//     // fetching user id from the request
//     const _id = req.params.id
//     try {
//         const user = await User.findById(_id)
//         if(!user){
//             return res.status(404).send()
//         }
//         res.send(user)
//     } catch (error) {
//         res.status(500).send()
//     }
// })

router.patch("/users/me", auth, async (req, res) => {
  const body = req.body;

  // List out the properties the user is authorized to edit
  const allowedUpdates = ["name", "email", "password", "age"];

  // We pass to it the object we are trying to work with from the db. Keys will return an array of strings for the properties on the object.
  const updates = Object.keys(body);

  // To check if the property is allowed to be updated. Goes over each property from allowed and maps it with the coming property from request.body. Only returns true if all are allowed to be updated.
  const isValid = updates.every((update) => {
    return allowedUpdates.includes(update);
  });
  
  if (!isValid) {
    return res.status(400).send("Invalid Updates");
  }

  try {
    const user = req.user;

    updates.forEach((update) => {
      // we use [] to get the property to update dynamically as we dont know what it is
      user[update] = body[update];
    });

    await user.save();

    res.send(user);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.delete("/users/me", auth, async (req, res) => {
  const user = req.user;
  try {
    await user.remove();

    sendCancelEmail(user.email, user.name)

    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
});

// uploading files
const upload = multer({
  // limits is an object which we use to define max file size which can be upload, it is in bytes
  limits: {
    fileSize: 1000000,
  },
  // filter out which files we want to allow the user to upload
  fileFilter(req, file, callback) {
    // look at the file name and figure out which extension it is
    // endsWith allows us to find a file that ends with that extensions, e.g. .pdf
    // match allows us to provide regular expressions with the two //
    if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
      return callback(new Error("Upload an image only"));
    }

    callback(undefined, true);

    // // callback types available:
    // callback(new Error('File must be a PDF'))
    // callback(undefined, true)
    // callback(undefined, false)
  },
});

router.post("/users/me/avatar", auth, upload.single("avatar"), async (req, res) => {
    // // accessing validated data in the buffer form
    // // buffer contains all the binary data of the incoming file, storing it on the user.avatar property
    // req.user.avatar  = req.file.buffer

    // using sharp instead of manually storing like above:
    // storing the buffer of the modified image file coming we get from sharp
    // .png will convert any incoming image file into png, resize will change the image size
    const buffer = await sharp(req.file.buffer)
      .resize({ width: 250, height: 250 })
      .png()
      .toBuffer();

    req.user.avatar = buffer;

    await req.user.save();

    res.send();
  }, // define a function to handle and display errors in JSON instead of html
  // all four parameters are important as this let express know that this function is used for error handling
  (error, req, res, next) => {
    res.status(400).send({ error: error.message });
  }
);

router.delete("/users/me/avatar", auth, async (req, res) => {
  // saving the user profile to undefine to delete it, this will remove any data and replace it with nothing when we push it in db.
  req.user.avatar = undefined;

  await req.user.save();

  res.send();
});

// to display image in browser
router.get("/users/:id/avatar", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || !user.avatar) {
      // will redirect the flow to the catch block
      return new Error();
    }

    // setting up response header, to tell the client what type of response it is
    // we haven't had to use this before as express automatically sends it back on its own with 'application/json' but since this time our response isn't of type json so we need to specify it ourselves now
    res.set("Content-Type", "image/jpg");

    res.send(user.avatar);
  } catch (error) {
    res.status(404).send();
  }
});

module.exports = router;

require('dotenv').config()

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const stripe = require('stripe')('STRIPE_SECRET_KEY'); // Add your Secret Key Here

const app = express();
// This will make our form data much more useful
app.use(bodyParser.urlencoded({ extended: true }));

// This will set express to render our views folder, then to render the files as normal html
app.set('view engine', 'ejs');
app.engine('html', require('ejs').renderFile);

app.use(express.static(path.join(__dirname, './views')));


app.post("/create-payment", async (req, res) => {
  try {
    // method : automatic deduct payment
    if (!req.body.manualpayment) {
      // create new customer (TODO : create new if customer not registered)
      stripe.customers
        .create({
          name: req.body.name,
          email: req.body.email,
          source: req.body.stripeToken
        })
        .then(customer =>
          // charges and paymentIntents method to create and caputured payment of customer
          stripe.charges.create({
            amount: req.body.amount,
            currency: "usd", // NOT suppourted test account in india
            customer: customer.id,
          })
        )
        .then(() => res.render("completed.html"))
        .catch(err => res.render("failed.html"));
    }
    else {
      // create new customer (TODO : create new if customer not registered)
      stripe.customers
        .create({
          name: req.body.name,
          email: req.body.email,
          source: req.body.stripeToken
        })
        .then(customer =>
          // charges and paymentIntents method to create and caputured payment of customer
          stripe.paymentIntents.create({
            amount: req.body.amount,
            currency: "usd", // NOT suppourted test account in india
            payment_method_types: ['card'],
            payment_method: customer.default_source,
            capture_method: 'manual',
            confirm: true,
            customer: customer.id,
          })
        )
        .then(() => res.render("payment-captured.html"))
        .catch(err => res.render("failed.html"));
    }
  } catch (err) {
    res.render("failed.html")
  }
});

app.get("/create-payment", async (req, res) => {
  res.render("payment-captured.html")
})

app.post("/payment-capture", async (req, res) => {
  const paymentId = req.body.paymentId
  const amount = req.body.amount

  // payment captured from customer
  stripe.paymentIntents.capture(paymentId, {
    amount_to_capture: amount,
  })
    .then(() => res.render("completed.html"))
    .catch(err => res.render("failed.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('Server is running...'));
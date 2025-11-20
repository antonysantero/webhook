const express = require("express");
const { exec } = require("child_process");
const crypto = require("crypto");
const fs = require('fs');
const https = require('https');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// Charger les certificats SSL
const options = {
  key: fs.readFileSync('/tmp/certs/privkey.pem'),
  cert: fs.readFileSync('/tmp/certs/fullchain.pem')
};

const SECRET = "ton_secret_webhook"; // même que dans GitHub

app.post("/github-webhook", (req, res) => {
  const signature = req.headers["x-hub-signature-256"];
  const payload = JSON.stringify(req.body);

  // Vérification de la signature
  const hmac = crypto.createHmac("sha256", SECRET);
  const digest = "sha256=" + hmac.update(payload).digest("hex");

  if (signature !== digest) {
    return res.status(401).send("Invalid signature");
  }

  // Déploiement
  exec("cd /home/asantero/miniblogmysql && git pull origin main && npm install && pm2 restart mon-app", (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Deploy failed");
    }
    console.log(stdout);
    res.status(200).send("Deploy success");
  });
});

// Lancer le serveur HTTPS
https.createServer(options, app).listen(10050, () => {
  console.log('Serveur HTTPS démarré sur le port 10050');
});



const express = require('express');
const mongoose = require('mongoose');
const auth = require('http-auth');
const { check, validationResult } = require('express-validator');

const router = express.Router();
const Registration = mongoose.model('Registration');
const basic = auth.basic({ realm: 'Simple Kitchen registrations' }, (username, password, done) => {
  done(Boolean(process.env.ADMIN_USER && process.env.ADMIN_PASSWORD) &&
    username === process.env.ADMIN_USER && password === process.env.ADMIN_PASSWORD);
});

router.get('/', (req, res) => res.render('index', { title: 'Simple Kitchen' }));
router.get('/register', (req, res) => res.render('form', { title: 'Register' }));
router.get('/thanks', (req, res) => res.render('thanks', { title: 'Thank you' }));
router.get('/registrations', (req, res, next) => {
  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASSWORD) {
    return res.status(503).send('Set ADMIN_USER and ADMIN_PASSWORD to view registrations.');
  }
  return next();
}, basic.check((req, res) => {
  Registration.find()
    .then((registrations) => res.render('registrations', { title: 'Registrations', registrations }))
    .catch(() => res.status(500).send('Sorry! Something went wrong.'));
}));
router.post('/register', [
  check('name').trim().notEmpty().withMessage('Please enter a name'),
  check('email').trim().isEmail().withMessage('Please enter a valid email'),
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('form', { title: 'Register', errors: errors.array(), data: req.body });
  }
  const registration = new Registration({ name: req.body.name, email: req.body.email });
  return registration.save()
    .then(() => res.redirect('/thanks'))
    .catch(() => res.status(500).send('Sorry! Something went wrong.'));
});
module.exports = router;

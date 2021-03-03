'use strict';

// Application Dependencies
const express = require('express');
const server = express();
//CORS = Cross Origin Resource Sharing
const cors = require('cors');
//DOTENV (read our enviroment variable)
require('dotenv').config();
// Superagent
const superagent = require('superagent');
const methodOverride = require('method-override');

// postgresql
const pg = require('pg');
const client = new pg.Client(process.env.DATABASE_URL);
// const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

//Application Setup
const PORT = process.env.PORT || 3030;

server.use(methodOverride('_method'));
server.use(cors());
server.use(express.static('./public'));
server.use(express.urlencoded({ extended: true }));
server.set('view engine', 'ejs');

// server.use(errorHandler);

// Route definitions
server.get('/', homeRoute);
server.get('/new', handleSearch);
server.post('/searches', searchResult);
server.get('/books/:bookID', bookDetails);
server.post('/books', bookAdd);
server.put('/books/:bookID', updateBook);
server.delete('/books/:bookID', deleteBook);


// Home route
function homeRoute(req, res) {
    // let SQL = `SELECT * FROM books;`;
    let SQL = 'SELECT books.id as id, title, isbn, author_id, img, description, authors.name as author FROM books, authors WHERE books.author_id=authors.id;';
    client.query(SQL)
        .then(allBooks => {
            res.render('pages/index', { bookList: allBooks.rows });
        })
        .catch(() => {
            errorHandler(`Sorry, we're having some error in getting your books!`, req, res);
        })
}

function bookDetails(req, res) {
    // let SQL = `SELECT * from books WHERE id=${req.params.bookID};`;
    let SQL = `SELECT books.id as id, title, isbn, author_id, img, description, authors.name as author FROM books, authors WHERE books.author_id=authors.id AND books.id=${req.params.bookID};`;
    client.query(SQL)
        .then(result => {
            res.render('pages/books/show', { book: result.rows[0] })
        })
        .catch(() => {
            errorHandler(`Sorry, we're having some error in getting you more details!`, req, res);
        })
}

// Show form function
function handleSearch(req, res) {
    res.render('pages/searches/new');
}

// searchResult function
function searchResult(req, res) {
    let search = req.body.search;
    let searchBy = req.body.searchBy;
    let url = `https://www.googleapis.com/books/v1/volumes?q=+${searchBy}:${search}`;
    superagent.get(url)
        .then(bookData => {
            let bookArr = bookData.body.items.map(value => new Book(value));
            res.render('pages/searches/show', { books: bookArr });
        })
        .catch(() => {
            errorHandler(`Sorry, we're having some error in finding what you're searching for!`, req, res);
        })
}

// Add book to database
function bookAdd(req, res) {
    let SQL = `INSERT INTO books (title, author, description, img, isbn, shelf)
    VALUES($1,$2,$3,$4,$5,$6) RETURNING id;`;
    let values = [req.body.title, req.body.author, req.body.description, req.body.img, req.body.isbn, req.body.shelf];
    client.query(SQL, values)
        .then(result => {
            res.redirect(`/books/${result.rows[0].id}`);
        })
        .catch(() => {
            errorHandler(`Sorry, we're having some error in finding this book!`, req, res);
        })
}

// update book in the db
function updateBook(req, res) {
    console.log(req.body);
    let SQL = `UPDATE books SET title=$1, author=$2, description=$3, img=$4, isbn=$5, shelf=$6
    WHERE id=$7;`
    let values = [req.body.title, req.body.author, req.body.description, req.body.img, req.body.isbn, req.body.shelf, req.params.bookID];
    client.query(SQL, values)
        .then(() => {
            res.redirect(`/books/${req.params.bookID}`);
        })
        .catch(() => {
            errorHandler(`Sorry, we're having some error editing this book!`, req, res);
        })
}

// delete a book from DB
function deleteBook(req, res) {
    let SQL = 'DELETE FROM books WHERE id=$1;';
    let values = [req.params.bookID];
    console.log(req.params.bookID);
    client.query(SQL, values)
        .then(() => {
            console.log(values);
            res.redirect(`/`);
        })
        .catch(() => {
            errorHandler(`Sorry, we're having some error deleting this book!`, req, res);
        })
}


server.get('*', (req, res) => {
    res.status(404).send('This route does not exist')
});

function errorHandler(error, req, res) {
    let errObj = {
        status: 500,
        error: error
    }
    res.render('pages/error', { error: errObj });
}

// Book constructor
function Book(data) {
    this.title = (data.volumeInfo.title) ? data.volumeInfo.title : `Title unavilable`;
    this.author = (Array.isArray(data.volumeInfo.authors)) ? data.volumeInfo.authors.join(', ') : `Unknown Author`;
    this.description = (data.volumeInfo.description) ? data.volumeInfo.description : `description unavilable`;
    this.img = (data.volumeInfo.imageLinks) ? data.volumeInfo.imageLinks.thumbnail : `https://i.imgur.com/J5LVHEL.jpg`;
    this.isbn = (data.volumeInfo.industryIdentifiers) ? data.volumeInfo.industryIdentifiers[0].identifier : `Unknown ISBN`;
    this.shelf = (data.volumeInfo.categories) ? data.volumeInfo.categories : `The book is not in a shelf`;
}

client.connect()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`listening on ${PORT}`);
        })
    })
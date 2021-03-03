
<!-- Create authors table -->
CREATE TABLE AUTHORS (id SERIAL PRIMARY KEY, name VARCHAR(255));

<!-- Insert authors data -->
INSERT INTO authors(name) SELECT DISTINCT author FROM books;

<!-- Add authors ID column in books table -->
ALTER TABLE books ADD COLUMN author_id INT;

<!-- Add authors ID data in books table authors ID column -->
UPDATE books SET author_id=author.id FROM (SELECT * FROM authors) AS author WHERE books.author = author.name;

<!-- Remove authors column from books table -->
ALTER TABLE books DROP COLUMN author;

<!-- Set the authors ID as a foreign key -->
ALTER TABLE books ADD CONSTRAINT fk_authors FOREIGN KEY (author_id) REFERENCES authors(id);
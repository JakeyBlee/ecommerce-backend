# E-Commerce Backend RESTful API

## Description

This is an independent coding project suggested by the Codecademy platform. It is built around the Node Express.js framework to enable a fully functional RESTful API that allows for CRUD operations. 

The project's main purpose is to provide a functional backend to be used by an accompanying React Frontend, in order to mimic a production standard, scalable e-commerce application. This project serves as a capstone to the end of the Back End Developer section of my Full Stack Developer Career Path progression.

## Features

This API allows for the storage and alteration of user details, product details, and orders made by registered users. It also stores an up-to-date record of items currently in each user's basket. The project is hosted on an AWS EC2 server, accessing datasets hosted on an AWS RDS Postgres, which in turn references images stored within an AWS S3 bucket.

This RESTful API allows for the creation of user accounts, which can be in turn used to login to user sessions so that individuals can browse, view and purchase a variety of items stored within the linked Postgres database.

Authentication and Authorization are handled through Express.passport and payments are processed through Stripe.js. This is not enabled to handle geniune payments and can only process example card data. CORS is enabled on this server and logging is handled through the Morgan node package.

Full documentation of the HTTP requests supported by this API are viewable from the OpenAPI.yaml file within this directory.

## How to Use

This App will be hosted on a remote site, and therefore should not need any additional steps to deploy. Typing a term into the post searchbar will return relevant items via the API for viewing. Specific subreddits can also be filtered through the use of the subreddit searchbar. Subreddits can be further filtered by new, hot and top posts.

## Technololgies

This project is written using JavaScript and Node.js. It is built primarily around the Express.js framework, and utilises Passport.js for authentication and Stripe.js for payment processing.

The project is hosted on an AWS EC2 server and links to an AWS RDS Postgres database, which in turn references image dumps on an AWS S3 bucket.

## Collaboraters

I am the sole author of this project following its initiation through bootstrapping.

## Licence

The contents of this repository are owned solely by their author.
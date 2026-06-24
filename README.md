# Mill Creek Urban Farm

## Introduction

Full-stack application for Mill Creek Urban Farm (Mill Creek United Foundation), built with MongoDB, Express.js, React.js, Node.js, and JavaScript.

The client is a React app (Vite) using [MUI](https://mui.com) and [TailwindCSS](https://tailwindcss.com/) for styling; the server is Express connected to MongoDB.


<!-- Description about the app -->

## Requirements

- Node.js ([Installation](https://nodejs.org/en))
- MongoDB ([Community edition](https://www.mongodb.com/docs/manual/installation/))



## Setup

Install all dependencies for `client/` and `server/`.

In two separate terminals:

```
cd client
npm install
```

```
cd server
npm install
```

Create `.env` files in both `client/` and `server/`

```
root/
  client/
    .env
  server/
    .env
```

In `client/.env`, put:

```
VITE_SERVER_URL=http://localhost:8080
```

In `server/.env`, put:

```
NODE_ENV=development
PORT=8080
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/mcuf_app?retryWrites=true&w=majority
CLIENT_URL=http://localhost:5173
JWT_SECRET=your-secret-jwt-key-here

# Email configuration (Nodemailer)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=your-email@gmail.com
```

**Note on Email Setup:**
- Email notifications are sent when users sign up
- For Gmail: Enable 2-factor authentication and generate an [App Password](https://myaccount.google.com/apppasswords)
- Use the app password (not your regular Gmail password) for `EMAIL_PASSWORD`
- For other email services, update `EMAIL_SERVICE` accordingly and adjust the transporter configuration in `src/services/email.service.js`

### Running client and server

In two separate terminals:

```
cd client
npm run dev
```

```
cd server
npm start
```

## Technologies

### Frontend

- [React.js](https://reactjs.org/)
  - [Vite](https://vite.dev/)
- [TailwindCSS](https://tailwindcss.com/)
- [MUI](https://mui.com)
- [Axios](https://axios-http.com/)

### Backend

- [MongoDB](https://www.mongodb.com/)
  - [Mongoose](https://mongoosejs.com/)
- [Express.js](https://expressjs.com/)
- [Nodemailer](https://nodemailer.com/) (Email service)

### Others

- [Babel](https://babeljs.io/) (Transpiler)
- [Eslint](https://eslint.org/) (Linter)

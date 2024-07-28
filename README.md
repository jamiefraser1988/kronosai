# Kronos AI Chat Application

This project is a chat application that allows users to communicate with an AI assistant. It features a user-friendly interface with options to view and manage chat history, change themes, and submit suggestions. Both the backend for the web app and a separate API are hosted on Heroku.

## Features

- **Chat with AI Assistant**: Engage in conversations with an AI assistant.
- **Chat History**: Save and load chat history.
- **Themes**: Switch between different themes.
- **Suggestions**: Submit and view suggestions.
- **Settings**: Adjust line height and font size.

## Prerequisites

- Node.js
- npm (Node Package Manager)
- React
- Express
- Heroku CLI (for deployment)

## Getting Started

### Clone the Repository

```sh
git clone https://github.com/jamiefraser1988/kronosai.git
cd kronosai
```

### Install Dependencies

#### Frontend

Navigate to the `kronosai-web` directory and install the dependencies:

```sh
cd kronosai-web
npm install
```

#### Backend

Navigate to the `backend` directory inside `kronosai-web` and install the dependencies:

```sh
cd backend
npm install
```

### Run the Application Locally

#### Frontend

Start the React development server:

```sh
cd ../kronosai-web
npm start
```

The frontend will be available at `http://localhost:3000`.

#### Backend

Start the Express server:

```sh
cd backend
node index.js
```

The backend will be available at `http://localhost:5000`.

### Deploying to Heroku

#### Backend

1. Log in to Heroku:

    ```sh
    heroku login
    ```

2. Create a new Heroku application:

    ```sh
    heroku create kronosai-backend
    ```

3. Deploy the backend to Heroku:

    ```sh
    git add .
    git commit -m "Deploy backend to Heroku"
    git push heroku main
    ```

4. Open the deployed backend:

    ```sh
    heroku open
    ```

#### Frontend

Since the frontend is already deployed, you don't need to redeploy it. Ensure the backend URL in your frontend code points to the Heroku backend URL.

#### API

1. Log in to Heroku:

    ```sh
    heroku login
    ```

2. Navigate to the `kronos-api` directory:

    ```sh
    cd ../kronos-api
    ```

3. Create a new Heroku application:

    ```sh
    heroku create kronosai-api
    ```

4. Deploy the API to Heroku:

    ```sh
    git add .
    git commit -m "Deploy API to Heroku"
    git push heroku main
    ```

5. Open the deployed API:

    ```sh
    heroku open
    ```

### Configuration

Ensure the backend URL in the frontend code is set correctly:

```javascript
const res = await fetch('https://kronosai-backend.herokuapp.com/send_message', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ user_input: escapedUserInput, chat_history: chatHistory, chat_title: chatTitle })
});
```

## Project Structure

```
kronosai/
├── kronosai-web/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── App.js
│   │   ├── App.css
│   │   └── index.js
│   ├── backend/
│   │   ├── index.js
│   │   ├── package.json
│   └── package.json
└── kronos-api/
    ├── index.js
    ├── package.json
    └── README.md
```

## Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -m 'Add some feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Open a pull request.

## License

This project is licensed under the MIT License - see the LICENSE.md file for details.

## Acknowledgements

- [React](https://reactjs.org/)
- [Express](https://expressjs.com/)
- [Heroku](https://www.heroku.com/)
- [Highlight.js](https://highlightjs.org/)
- [Marked](https://marked.js.org/)

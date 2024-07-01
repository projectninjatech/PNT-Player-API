# PNT Player API With NodeJS & MongoDB

## Description
This Node.js app serves as a movie API using TMDB (The Movie Database) as a data source. It provides endpoints to access movie information and media files stored locally.

## Getting Started
Follow these steps to set up and run the app on your local machine:

### Prerequisites
- Node.js installed on your system

### Installation
1. Clone this repository to your local machine.
2. Navigate to the project directory in your terminal.

### ENVIROMENT VARIABLE Configuration
1. Create a `.env` file in the root directory of the project.
2. Pick a DIR to store medias and create three DIR inside it with names as `movies` `shows` `posters`
3. Add the following environment variables to the `.env` file:
   ```plaintext
   TMDB_AUTH_KEY = "YOUR TMDB AUTH KEY"
   MONGO_DB_URL = "YOUR MONGODB URL"
   ADMIN_REGISTER_SECRET_CODE = "YOUR SECRECT CODE TO ALLOW ADMIN REGISTER e.g. abcd1234"
   HTTP_SERVER_ADDR = "YOUR HTTP SERVER ADDRESS e.g. http://192.168.0.148:8080"
   HTTP_SERVER_MEDIA_DIR = "YOUR MEDIA SERVER MAIN DIRECTORY e.g. C:/Users/imran/Downloads/Video"
   MOVIE_DIR = "YOUR MOVIE DIRECTORY e.g. C:/Users/imran/Downloads/Video/movies (dir name should be movies)"
   SHOWS_DIR = "YOUR SHOWS DIRECTORY e.g. C:/Users/imran/Downloads/Video/shows (dir name should be shows)"
   PORT = 5000

### Start the App on Windows
1. Install dependencies by running:
npm install
2. Start the Node.js server by running:
node app.js or npm run dev (if running locally which will create http-server)

### Deploy the App on Ubuntu Server
1. Clone the repo
2. Install all the packages and dependencies:
   ```plaintext
   npm install

3. Create the .env file (follow the instruction to create .env as mentioned above)
4. Install NodeJS:
   ```plaintext
   curl -fsSL https://deb.nodesource.com/setup_21.x | sudo -E bash - &&\
   sudo apt-get install -y nodejs

5. Check the NodeJs and npm version:
   ```plaintext
   node --version && npm --version

6. Install PM2 so that the app will run in the background:
   ```plaintext
   sudo npm i pm2 -g
   pm2 start npm --name "httpserver" -- run start:server
   pm2 start npm --name "app" -- run app

7. To reboot or poweroff from the admin dashboard:
Open Ubuntu Server terminal and type -
   ```plaintext
   sudo visudo

Add the following lines at the end of the file, replacing <username> with your actual username:
   ```plaintext
   <username> ALL=(ALL) NOPASSWD: /sbin/poweroff
   <username> ALL=(ALL) NOPASSWD: /sbin/reboot

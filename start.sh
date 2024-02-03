#!/bin/bash

# Start the Next.js app
npm run start &

# Start your worker file
./node_modules/.bin/ts-node summarizer.js

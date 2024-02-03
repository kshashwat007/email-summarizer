#!/bin/bash

# Start the Next.js app
npm run start &

# Start your worker file
ts-node summarizer.js

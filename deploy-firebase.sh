#!/bin/bash

# Firebase Deployment Script for ClarifyFact
# This script automates the deployment process

echo "🚀 Starting Firebase Deployment..."
echo ""

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed"
    echo "   Install it with: npm install -g firebase-tools"
    exit 1
fi

# Check if logged in
echo "📋 Checking Firebase login status..."
if ! firebase projects:list &> /dev/null; then
    echo "⚠️  Not logged in to Firebase"
    echo "   Run: firebase login"
    exit 1
fi

# Build React app
echo ""
echo "🔨 Building React app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Install function dependencies
echo "📦 Installing function dependencies..."
cd functions
npm install
cd ..

if [ $? -ne 0 ]; then
    echo "❌ Function dependencies installation failed!"
    exit 1
fi

echo "✅ Dependencies installed!"
echo ""

# Check if OpenAI API key is set
echo "🔑 Checking configuration..."
if ! firebase functions:config:get openai.api_key &> /dev/null; then
    echo "⚠️  WARNING: OpenAI API key not set in Firebase config"
    echo "   Set it with: firebase functions:config:set openai.api_key=\"your-key\""
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Deploy
echo ""
echo "🚀 Deploying to Firebase..."
echo ""

read -p "Deploy hosting? (y/n) " -n 1 -r
echo
DEPLOY_HOSTING=""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    DEPLOY_HOSTING="--only hosting"
fi

read -p "Deploy functions? (y/n) " -n 1 -r
echo
DEPLOY_FUNCTIONS=""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    DEPLOY_FUNCTIONS="--only functions"
fi

if [ -z "$DEPLOY_HOSTING" ] && [ -z "$DEPLOY_FUNCTIONS" ]; then
    echo "❌ Nothing to deploy!"
    exit 1
fi

DEPLOY_ARGS=""
if [ ! -z "$DEPLOY_HOSTING" ] && [ ! -z "$DEPLOY_FUNCTIONS" ]; then
    DEPLOY_ARGS="--only hosting,functions"
elif [ ! -z "$DEPLOY_HOSTING" ]; then
    DEPLOY_ARGS="$DEPLOY_HOSTING"
else
    DEPLOY_ARGS="$DEPLOY_FUNCTIONS"
fi

firebase deploy $DEPLOY_ARGS

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Deployment successful!"
    echo ""
    echo "🌐 Your site should be live at:"
    firebase hosting:sites:list
    echo ""
    echo "📊 View logs with: firebase functions:log"
else
    echo ""
    echo "❌ Deployment failed!"
    exit 1
fi


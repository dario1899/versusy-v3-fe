# React Picture Versus App

A React application that displays two pictures in a "versus" format, featuring clickable functionality to show text overlays on both images simultaneously.

## Features

- Displays two pictures in a versus format using mock data (no backend required)
- Click any image to reveal text overlays on BOTH pictures
- "Next Versus" button to cycle through different picture sets
- 4 different themed versus rounds (Nature vs Architecture, Ocean vs Forest, etc.)
- Responsive design with hover effects
- Simulated loading states for realistic UX
- Modern UI with smooth animations

## Setup Instructions

### Frontend (React App)

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

The React app will run on `http://localhost:3000`

**No backend server needed!** The app uses mock data for images and text.

## Mock Data

The app uses mock data defined in `PictureDisplay.js`:

### Images
- Beautiful mountain landscape from Picsum Photos
- Modern city architecture from Picsum Photos

### Text Content
- Detailed descriptions for each image
- Realistic content that appears when images are clicked

## How It Works

1. The React app loads a set of two images in "versus" format with a simulated loading state
2. When a user clicks on ANY image, it reveals text overlays on BOTH pictures simultaneously
3. The "Next Versus" button cycles through 4 different themed rounds:
   - **Round 1**: Nature vs Architecture
   - **Round 2**: Ocean vs Forest  
   - **Round 3**: Desert vs Snow
   - **Round 4**: Urban vs Rural
4. Each round has unique images and descriptive text content
5. All functionality works without any backend server

## Project Structure

```
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── PictureDisplay.js
│   │   └── PictureDisplay.css
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── server.js
├── package.json
└── README.md
```

## Customization

- Modify the `mockImages` array in `PictureDisplay.js` to change the images
- Update the `mockTexts` object to change the text content
- Customize styling in the CSS files
- Add more images by extending the mock data arrays

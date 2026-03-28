const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Sample data
const images = [
  {
    id: 1,
    url: 'https://picsum.photos/400/300?random=1',
    alt: 'Beautiful landscape'
  },
  {
    id: 2,
    url: 'https://picsum.photos/400/300?random=2',
    alt: 'Amazing architecture'
  }
];

const texts = {
  1: "This is a stunning landscape captured in the mountains. The view is breathtaking with rolling hills and a clear blue sky. Perfect for hiking and photography enthusiasts!",
  2: "An architectural masterpiece showcasing modern design principles. The building features innovative materials and sustainable construction methods that blend seamlessly with nature."
};

// API Routes

// GET /api/images - Fetch all images
app.get('/api/images', (req, res) => {
  try {
    res.json(images);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch images' });
  }
});

// GET /api/text/:id - Fetch text for specific image
app.get('/api/text/:id', (req, res) => {
  try {
    const imageId = parseInt(req.params.id);
    const text = texts[imageId];
    
    if (!text) {
      return res.status(404).json({ error: 'Text not found for this image' });
    }
    
    res.json({ text });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch text' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log(`  GET /api/images - Fetch all images`);
  console.log(`  GET /api/text/:id - Fetch text for image ID`);
  console.log(`  GET /api/health - Health check`);
});

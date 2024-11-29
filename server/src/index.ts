import app from './app';
import pdfRoutes from './routes/pdfRoutes';
import signedUrlRoutes from './routes/signedUrlRoutes';

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server is healthy and running!' });
});

// Register routes
app.use('/api/pdf', pdfRoutes);
app.use('/api/signed-url', signedUrlRoutes);

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

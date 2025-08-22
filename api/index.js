/** Placeholder API (to be implemented) */
import express from 'express';
const app = express();
app.get('/__ping', (_,res)=>res.type('text').send('OK'));
app.listen(3000, ()=>console.log('API placeholder on :3000'));

// --- Health endpoint ---
app.get('/_health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    ts: new Date().toISOString()
  });
});

const express = require('express');
const cors = require('cors');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const items = [
    {
        id: 1,
        name: 'Graphing Calculator',
        category: 'Electronics',
        description: 'TI-84 calculator available for math classes.',
        available: true
    },
    {
        id: 2,
        name: 'Biology Textbook',
        category: 'Books',
        description: 'Used biology textbook for intro bio.',
        available: true
    },
    {
        id: 3,
        name: 'Soccer Ball',
        category: 'Sports',
        description: 'Soccer ball available to borrow.',
        available: false
    }
];

app.get('/', (req, res) => {
    res.send('Welcome to the CampusBorrow API!');
});

app.get('/api/items', (req, res) => {
    res.json(items);
});

app.get('/api/items/:id', (req, res) => {
    const itemId = parseInt(req.params.id);
    const item = items.find(item => item.id === itemId);

    if (!item) {
        return res.status(404).json({ message: 'Item not found' });
    }

    res.json(item);
});

app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});
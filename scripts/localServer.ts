import express from 'express';
import cors from 'cors';
import { handler as getCurrentGame } from '../handlers/http/game_GET';
import { handler as makeGuess } from '../handlers/http/game_POST/game_POST';

process.env.IS_LOCAL = 'true';
process.env.AWS_REGION = 'eu-west-1';

const app = express();
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: false,
}));

app.get('/game', async (req, res) => {
    const result = await getCurrentGame();
    res.status(result.statusCode).send(result.body);
});

app.post('/game', async (req, res) => {
    const result = await makeGuess({
        httpMethod: 'POST',
        path: '/game',
        headers: req.headers,
        body: JSON.stringify(req.body),
    } as any);

    res.status(result!.statusCode).send(result!.body);
});

app.listen(3000, () => {
    console.log('Local API on http://localhost:3000');
});

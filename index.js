import path from 'path';
import express from 'express'
import {setTargetURL,setAttackDuration,StartAtack,StopAtack} from './httpbypass.js'
import { fileURLToPath } from 'url';
const app = express()
app.use(express.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'html')));

const HOST = 'localhost'
const PORT = 3000

app.get('/',(req,res) => {
    res.sendFile(path.join(__dirname, 'html', 'index.html'));
})
app.post('/attack', (req, res) => {
    const { targetURL, attackTime } = req.body;
    console.log(`Получен запрос на атаку: URL = ${targetURL}, Время = ${attackTime} секунд`);
    if(targetURL == '' || attackTime == ''){
        res.send('Ошибка ввода!')
        return
    }
    // Здесь добавьте логику атаки, если это необходимо
    setTargetURL(targetURL);
    setAttackDuration(attackTime);
    StartAtack()
    // Отправляем ответ обратно клиенту
    res.send({ message: `Атака на ${targetURL} на ${attackTime} секунд запущена!` });
});
app.post('/stop',(req,res)=>{
    console.log(`Получен запрос на остановку атаки.`);
    StopAtack()
    res.send({ message: `Атака остановлена.`});
})

app.listen(PORT,HOST, () => {
  console.log(`Server is running on ${HOST}:${PORT}`)
})

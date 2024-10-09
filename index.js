import path from 'path';
import express from 'express'
import {setTargetURL,setAttackDuration,StartAttack,StopAttack} from './httpbypass.js'
import { fileURLToPath } from 'url';
const app = express()
app.use(express.json());
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'html')));

const HOST = 'localhost'
const PORT = 3000

let logs = [];
let errors = [];

app.get('/clear',(req,res)=>{
    logs = [];
    errors = [];
    console.log('Логи снесены!');
})

// Эндпоинт для отправки логов и ошибок
app.get('/logs', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Функция для отправки данных
    const sendData = () => {
        const data = {
            logs,
            errors
        };
        res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    // Отправляем существующие логи и ошибки при подключении
    sendData();

    // Обработка новых логов
    const originalConsoleLog = console.log;
    console.log = function(...args) {
        originalConsoleLog.apply(console, args);
        const log = args.join(' ');
        logs.push(log);
        sendData();  // Отправляем логи клиенту
    };

    // Обработка ошибок
    const originalConsoleError = console.error;
    console.error = function(...args) {
        originalConsoleError.apply(console, args);
        const error = args.join(' ');
        errors.push(error);
        sendData();  // Отправляем ошибки клиенту
    };

    // Удаляем обработчик при закрытии соединения
    req.on('close', () => {
        //console.log('Клиент отключился');
        res.end();

        // Возвращаем оригинальные функции, чтобы избежать дублирования
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
    });
});

app.get('/',(req,res) => {
    res.sendFile(path.join(__dirname, 'html', 'index.html'));
})
app.post('/attack', (req, res) => {
    const { targetURL, attackTime,maxSocks,RPS } = req.body;
    console.log(`Принимаем пациента: URL = ${targetURL}, Время = ${attackTime} секунд`);
    if(targetURL == '' || attackTime == '' || maxSocks == ''|| RPS == ''){
        console.log('Объебосы в полях)')
        return
    }
    // Здесь добавьте логику атаки, если это необходимо
    setAttackDuration(attackTime);
    setTargetURL(targetURL);
    StartAttack(maxSocks,RPS)

});
app.post('/stop',(req,res)=>{
    StopAttack()
    console.log(`Кончаем, мальчики.`);
})

app.listen(PORT,HOST, () => {
  console.log(`Server is running on ${HOST}:${PORT}`)
})

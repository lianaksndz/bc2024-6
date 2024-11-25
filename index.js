const { Command } = require('commander');
const express = require('express');
const http = require('http');
const fs = require('fs').promises; 
const path = require('path');
const multer = require('multer');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');



const program = new Command();
program 
    .requiredOption('-h, --host <host>', 'адреса сервера')
    .requiredOption('-p, --port <port>', 'порт сервера')
    .requiredOption('-C, --cache <cache>',  'адреса кешованих файлів');
 
program.parse(process.argv);
const { host, port, cache } =  program.opts(); 

const app = express();

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Notes Service API',
            version: '1.0.0',
            description: 'API для роботи з нотатками',
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Local server',
            },
        ],
    },
    apis: ['./index.js'], // Вказуємо файл з документацією
};


const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(express.text()); 
const upload = multer(); 

/**
 * @swagger
 * /notes/{name}:
 *   get:
 *     summary: Отримати нотатку за іменем
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Ім'я нотатки
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Успішно отримано нотатку
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       404:
 *         description: Нотатка не знайдена
 *       500:
 *         description: Помилка при зчитуванні нотатки
 */
app.get(`/notes/:name`, async (req, res) => {
    const noteName = req.params.name;
    const notePath = path.join(cache, `${noteName}.txt`);

    try {
        await fs.access(notePath); 
    } 
    catch (error) {
        return res.status(404).send('Not Found'); 
    }

    try {
        const data = await fs.readFile(notePath);
        res.send(data);
    } catch (error) {
        console.error(error); 
        res.status(500).send('Error reading the note');
    }
});

/**
 * @swagger
 * /notes/{name}:
 *   put:
 *     summary: Замінити текст існуючої нотатки
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Ім'я нотатки
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *             description: Новий текст нотатки
 *             example: "Це новий текст для нотатки"
 *     responses:
 *       200:
 *         description: Нотатка була записана у файл
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       404:
 *         description: Нотатка не знайдена
 *       500:
 *         description: Помилка під час запису нотатки
 */
app.put('/notes/:name', async (req, res) => {
    const noteName = req.params.name;
    const notePath = path.join(cache, `${noteName}.txt`);
    const newNote = req.body; 
    try {
        await fs.access(notePath);
    } 
    catch (error) {
        return res.status(404).send('Not Found'); 
    }

    try {
        await fs.writeFile(notePath, newNote, 'utf8');
        res.send('Нотатка була записана у файл');
    } catch (error) {
        console.error(error); 
        res.status(500).send('Помилка під час запису нотатки');
    }
});

/**
 * @swagger
 * /notes/{name}:
 *   delete:
 *     summary: Видалити нотатку за іменем
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         description: Ім'я нотатки
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Видалено успішно
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       404:
 *         description: Нотатка не знайдена
 */
app.delete(`/notes/:name`, async (req, res) => {
    const noteName = req.params.name;
    const notePath = path.join(cache, `${noteName}.txt`);
    try {
        await fs.access(notePath);
    } 
    catch (error) {
        return res.status(404).send('Not Found'); 
    }

    try {
        fs.unlink(notePath)
        return res.status(200).send('Видалено успішно'); 
    }
    catch(err){
        return res.status(500).send('Помилка під час видалення нотатки'); 
    }
});

/**
 * @swagger
 * /notes:
 *   get:
 *     summary: Отримати всі нотатки
 *     parameters:
 *       - in: query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Успішно отримано нотатки
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: ім'я нотатки
 *                   text:
 *                     type: string
 *                     description: текст нотатки
 */
app.get(`/notes`, async (req, res) => {
    try {
        const files = await fs.readdir(cache);
        const notes = [];
    
        for (const file of files) {
            if (path.extname(file) === '.txt') {
                const noteName = path.basename(file, '.txt'); 
                const notePath = path.join(cache, file);
                const text = await fs.readFile(notePath, 'utf8');
                notes.push({ name: noteName, text });
            }
        }

        res.status(200).json(notes);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Error reading notes');
    }
});

/**
 * @swagger
 * /write:
 *   post:
 *     summary: Створити нову нотатку
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               note_name:
 *                 type: string
 *                 description: Назва нотатки
 *               note:
 *                 type: string
 *                 description: Текст нотатки
 *     responses:
 *       201:
 *         description: Нотатку створено
 *       400:
 *         description: Нотатка з таким іменем вже існує
 */
app.post('/write', upload.none(), async (req, res) => {
    const noteName = req.body.note_name;
    const noteText = req.body.note;
    const notePath = path.join(cache, `${noteName}.txt`);  

    try {
        const fileExists = await fs.access(notePath).then(() => true).catch(() => false);
        
        if (fileExists) {
            return res.status(400).send('Bad Request. Note already exists');
        }
        
        await fs.writeFile(notePath, noteText, 'utf8');
        return res.status(201).send('Created');
        
    } catch (error) {
        console.error(error);
        return res.status(500).send('Error creating note');
    }
});

/**
 * @swagger
 * /UploadForm.html:
 *   get:
 *     summary: Відправка HTML-форми
 *     description: Цей ендпоінт відправляє форму для завантаження файлів клієнту.
 *     responses:
 *       200:
 *         description: Успішно відправлено HTML-форму
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 *       500:
 *         description: Помилка при завантаженні HTML-файлу
 */
app.get('/UploadForm.html', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'UploadForm.html')); 
    }
    catch (err) {
        console.log(err);
        res.status(500).send('Error loading HTML form');
    }
});

app.listen(port, host, () => {
    console.log(`Сервер запущено на  http://${host}:${port}`);
});

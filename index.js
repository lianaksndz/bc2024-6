const {Command} = require('commander')
const express = require('express')
const http = require('http')
const path = require('path')
const fs = require('fs'). promises
const multer = require('multer')

const program = new Command();
program
    .requiredOption('-h, --host <host>', 'адреса сервера')
    .requiredOption('-p, --port <port>', 'порт сервера')
    .requiredOption('-C, --cache <cache>', 'адреса кешованих файлів');

program.parse(process.argv);
const { host, port, cache } = program.opts();

const app = express();

app.use(express.json());

const server = http.createServer(app);
const upload =multer();

server.listen(port, host, () => {
    console.log(`Сервер запущено на http://${host}:${port}`);
});
app.get(`/notes/:name`, async (req, res) => {
    const noteName = req.params.name; // test
    const notePath = path.join(cache, `${ noteName }.txt`); // ./cache/test.txt

    try {
        await fs.access(notePath);
    }
    catch (error) {
        return res.status(404).send('Not Found');
    }

    try {
        const data = await fs.readFile(notePath, 'utf8');
        res.send(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error reading the note');
    }
});
app.put('/notes/:name', async (req, res) => {
    const noteName = req.params.name;
    const notePath = path.join(cache, `${ noteName }.txt`);
    const newNote = req.body.text;
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

app.delete(`/notes/:name`, async (req, res) => {
    const noteName = req.params.name;
    const notePath = path.join(cache, `${ noteName }.txt`);
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
    catch (err) {
        return res.status(500).send('Помилка під час видалення нотатки');
    }
})

app.get(`/notes`, async (req, res) =>{
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
})

app.post('/write', upload.none(), async (req, res) => {
    const noteName = req.body.note_name;
    const noteText = req.body.note;
    const notePath = path.join(cache, `${ noteName }.txt`);

    try {
        try {
            await fs.access(notePath);
            return res.status(400).send('Bad Request. Note already exists');
        } catch {
            await fs.writeFile(notePath, noteText, 'utf8');
            return res.status(201).send('Created');
        }
    } catch (error) {
        console.error(error);
        return res.status(500).send('Error creating note');
    }
});

app.get('/UploadForm.html', (req, res) => {
    try {
        res.sendFile(path.join(__dirname, 'UploadForm.html'));
    }
    catch (err) {
        console.log(error)
    }
});
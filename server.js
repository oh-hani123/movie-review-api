
const http = require('http');
const fs = require('fs');
const url = require('url');


const MOVIES_FILE = './movies.json';

function readMovies() {
    try {
        const data = fs.readFileSync(MOVIES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        
        return [];
    }
}


function writeMovies(movies) {
    fs.writeFileSync(MOVIES_FILE, JSON.stringify(movies, null, 2));
}


function sendJSON(res, statusCode, data) {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
}


function getRequestBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}


const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    const method = req.method;

    
    if (path === '/movies' && method === 'GET') {
        const movies = readMovies();
        sendJSON(res, 200, movies);
    }

    
    else if (path.match(/\/movies\/(\d+)/) && method === 'GET') {
        const id = parseInt(path.split('/')[2]);
        const movies = readMovies();
        const movie = movies.find(m => m.id === id);
        
        if (movie) {
            sendJSON(res, 200, movie);
        } else {
            sendJSON(res, 404, { error: 'Movie not found' });
        }
    }

    
    else if (path === '/movies' && method === 'POST') {
        try {
            const body = await getRequestBody(req);
            const movies = readMovies();
            
            
            const newId = movies.length > 0 ? Math.max(...movies.map(m => m.id)) + 1 : 1;
            
            const newMovie = {
                id: newId,
                title: body.title,
                director: body.director,
                year: body.year,
                rating: body.rating
            };
            
            movies.push(newMovie);
            writeMovies(movies);
            sendJSON(res, 201, newMovie);
        } catch (error) {
            sendJSON(res, 400, { error: 'Invalid request body' });
        }
    }


    else if (path.match(/\/movies\/(\d+)/) && method === 'PUT') {
        const id = parseInt(path.split('/')[2]);
        
        try {
            const body = await getRequestBody(req);
            const movies = readMovies();
            const movieIndex = movies.findIndex(m => m.id === id);
            
            if (movieIndex === -1) {
                sendJSON(res, 404, { error: 'Movie not found' });
                return;
            }
            
            
            movies[movieIndex] = {
                ...movies[movieIndex],
                title: body.title || movies[movieIndex].title,
                director: body.director || movies[movieIndex].director,
                year: body.year || movies[movieIndex].year,
                rating: body.rating || movies[movieIndex].rating
            };
            
            writeMovies(movies);
            sendJSON(res, 200, movies[movieIndex]);
        } catch (error) {
            sendJSON(res, 400, { error: 'Invalid request body' });
        }
    }

    
    else if (path.match(/\/movies\/(\d+)/) && method === 'DELETE') {
        const id = parseInt(path.split('/')[2]);
        const movies = readMovies();
        const movieIndex = movies.findIndex(m => m.id === id);
        
        if (movieIndex === -1) {
            sendJSON(res, 404, { error: 'Movie not found' });
            return;
        }
        
        const deletedMovie = movies[movieIndex];
        movies.splice(movieIndex, 1);
        writeMovies(movies);
        sendJSON(res, 200, { message: 'Movie deleted successfully', deletedMovie });
    }

    
    else {
        sendJSON(res, 404, { error: 'Route not found' });
    }
});


const PORT = 3000;
server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Available endpoints:');
    console.log('  GET    /movies           - Get all movies');
    console.log('  GET    /movies/:id       - Get a specific movie');
    console.log('  POST   /movies           - Create a new movie');
    console.log('  PUT    /movies/:id       - Update a movie');
    console.log('  DELETE /movies/:id       - Delete a movie');
});
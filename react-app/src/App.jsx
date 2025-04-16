import Search from './components/Search';
import Spinner from './components/Spinner';
import MovieCard from './components/MovieCard';
import { useState, useEffect } from 'react';
import { useDebounce } from 'react-use';
import { updateSearchCount, getTrendingMovies } from './appwrite';

const API_BASE_URL = 'https://api.themoviedb.org/3';
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
    method: 'GET',
    headers: {
        'accept': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
    },
}

const App = () => {

    const [searchTerm, setSearchTerm] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [movieList, setMovieList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
    const [trendingMovies, setTrendingMovies] = useState([]);

    const fetchMovies = async (query = '') => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const endpoint = query ?
                `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}&sort_by=popularity.desc`
                :
                `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;
            const response = await fetch(endpoint, API_OPTIONS);
            if (!response.ok) {
                throw new Error('Failed to fetch movies');
            }
            const data = await response.json();
            if (data.Response === 'False') {
                setErrorMessage(data.Error || 'Failed to fetch movies');
                setMovieList([]);
                return;
            }
            setMovieList(data.results || []);

            if (query && data.results.length > 0) {
                try {
                    await updateSearchCount(query, data.results[0]);
                } catch (appwriteError) {
                    console.error('Failed to update search statistics:', appwriteError);
                    // Don't show this error to user since it's not critical to movie search functionality
                }
            }

            if (data.results.length === 0) {
                setErrorMessage('No movies found for this search term.');
            }
        } catch (error) {
            console.error(`Error fetching movies: ${error}`);
            setErrorMessage('Failed to fetch movies. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }

    const loadTrendingMovies = async () => {
        try {
            const movies = await getTrendingMovies();
            setTrendingMovies(movies);
        } catch (error) {
            console.log('Error fetching trending movies:', error);
        }
    }

    useDebounce(() => setDebouncedSearchTerm(searchTerm), 1500, [searchTerm]);

    useEffect(() => {
        fetchMovies(debouncedSearchTerm);
    }, [debouncedSearchTerm]);

    useEffect(() => {
        loadTrendingMovies();
    }, []);

    return (
        <main>
            <div className="pattern" />

            <div className="wrapper">
                <header>
                    <img src="../hero.png" alt="Hero Banner" />
                    <h1 className='text-gradient'>
                        Find Movies You'll Enjoy Without The Hassle
                    </h1>
                    <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
                </header>

                {trendingMovies.length > 0 && (
                    <section className='trending'>
                        <h2>Trending Movies</h2>
                        <ul>
                            {trendingMovies.map((movie, index) => (
                                <li key={movie.$id}>
                                    <p>{index + 1}</p>
                                    <img src={movie.poster_url} alt={movie.title} />
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section className="all-movies">
                    <h2>All Movies</h2>

                    {isLoading ? (
                        <span className="text-white"><Spinner /></span>
                    ) : errorMessage ? (
                        <span className="text-red-500">{errorMessage}</span>
                    ) : (
                        <ul>
                            {movieList.map((movie) => (
                                <li key={movie.id}>
                                    <MovieCard movie={movie} className="movie-item" />
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

            </div>
        </main>
    );
};

export default App;
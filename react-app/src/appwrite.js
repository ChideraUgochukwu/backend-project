import { Client, Databases, Query, ID } from 'appwrite';

const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject(PROJECT_ID);

const database = new Databases(client);

export const updateSearchCount = async (searchTerm, movie) => {
    try {
        const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.equal('searchTerm', searchTerm),
        ]);

        if (result.documents.length > 0) {
            const document = result.documents[0];
            await database.updateDocument(DATABASE_ID, COLLECTION_ID, document.$id, {
                count: document.count + 1,
                title: movie.title,
                movie_id: movie.id,
                poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}` : null,
                vote_average: movie.vote_average,
                release_date: movie.release_date,
                original_language: movie.original_language
            });
        } else {
            await database.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
                searchTerm: searchTerm,
                count: 1,
                title: movie.title,
                movie_id: movie.id,
                poster_url: movie.poster_path ? `https://image.tmdb.org/t/p/w500/${movie.poster_path}` : null,
                vote_average: movie.vote_average,
                release_date: movie.release_date,
                original_language: movie.original_language
            });
        }
    } catch (error) {
        console.error('Error updating search count:', error);
    }
}

export const getTrendingMovies = async () => {
    try {
        const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
            Query.limit(5),
            Query.orderDesc('count')
        ]);

        return result.documents;
    } catch (error) {
        console.error('Error fetching trending movies:', error);
        return []; // Return empty array instead of undefined
    }
}